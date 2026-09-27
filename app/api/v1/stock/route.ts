import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autenticarApiKey } from "@/lib/api-auth";
import { z } from "zod";

// GET — resumo de stock por produto
export async function GET(req: NextRequest) {
  const ctx = await autenticarApiKey(req.headers.get("authorization"));
  if (!ctx) return NextResponse.json({ erro: "Chave de API inválida ou inactiva" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const sku = searchParams.get("sku");
  const produtoId = searchParams.get("produtoId");

  const where = {
    lojaId: ctx.lojaId,
    ativo: true,
    ...(sku ? { sku } : {}),
    ...(produtoId ? { id: produtoId } : {}),
  };

  const produtos = await prisma.produto.findMany({
    where,
    select: {
      id: true,
      titulo: true,
      sku: true,
      stock: true,
      stockReservado: true,
      stockMinimo: true,
      variantes: { select: { id: true, nomeOpcao: true, sku: true, stock: true, stockReservado: true } },
    },
    take: 200,
  });

  return NextResponse.json({
    dados: produtos.map(p => ({
      id: p.id,
      titulo: p.titulo,
      sku: p.sku,
      stock: p.stock,
      stockReservado: p.stockReservado,
      stockDisponivel: p.stock - p.stockReservado,
      stockMinimo: p.stockMinimo,
      stockBaixo: p.stock <= p.stockMinimo,
      variantes: p.variantes.map(v => ({
        id: v.id,
        nomeOpcao: v.nomeOpcao,
        sku: v.sku,
        stock: v.stock,
        stockReservado: v.stockReservado,
        stockDisponivel: v.stock - v.stockReservado,
      })),
    })),
  });
}

// PATCH — ajustar stock de um produto via API
const AjusteSchema = z.object({
  produtoId: z.string(),
  varianteId: z.string().optional(),
  delta: z.number().int(),
  nota: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const ctx = await autenticarApiKey(req.headers.get("authorization"));
  if (!ctx) return NextResponse.json({ erro: "Chave de API inválida ou inactiva" }, { status: 401 });

  const body = await req.json();
  const parsed = AjusteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ erro: "Dados inválidos", detalhe: parsed.error.flatten() }, { status: 400 });

  const { produtoId, varianteId, delta, nota } = parsed.data;

  // Verificar que o produto pertence à loja
  const produto = await prisma.produto.findFirst({
    where: { id: produtoId, lojaId: ctx.lojaId },
    select: { id: true, stock: true, titulo: true },
  });
  if (!produto) return NextResponse.json({ erro: "Produto não encontrado" }, { status: 404 });

  if (varianteId) {
    const variante = await prisma.variante.findFirst({ where: { id: varianteId, produtoId }, select: { id: true, stock: true } });
    if (!variante) return NextResponse.json({ erro: "Variante não encontrada" }, { status: 404 });
    if (variante.stock + delta < 0) return NextResponse.json({ erro: "Stock insuficiente" }, { status: 409 });
    await prisma.variante.update({ where: { id: varianteId }, data: { stock: { increment: delta } } });
  } else {
    if (produto.stock + delta < 0) return NextResponse.json({ erro: "Stock insuficiente" }, { status: 409 });
    await prisma.produto.update({ where: { id: produtoId }, data: { stock: { increment: delta } } });
  }

  await prisma.movimentoStock.create({
    data: {
      lojaId: ctx.lojaId,
      produtoId,
      varianteId: varianteId ?? null,
      tipo: delta > 0 ? "REPOSICAO" : "AJUSTE",
      quantidade: Math.abs(delta),
      nota: nota ?? "Ajuste via API pública",
    },
  });

  return NextResponse.json({ ok: true, stockAtual: produto.stock + delta });
}
