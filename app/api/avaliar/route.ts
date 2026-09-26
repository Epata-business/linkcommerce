import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const AvaliacaoSchema = z.object({
  lojaId:       z.string().min(1),
  produtoId:    z.string().min(1),
  pedidoId:     z.string().optional(),
  clienteEmail: z.string().email(),
  clienteNome:  z.string().max(100).optional(),
  estrelas:     z.number().int().min(1).max(5),
  comentario:   z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 });
  }

  const parsed = AvaliacaoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: "Dados inválidos", detalhes: parsed.error.flatten() }, { status: 422 });
  }

  const { lojaId, produtoId, pedidoId, clienteEmail, clienteNome, estrelas, comentario } = parsed.data;

  // Verificar que o produto pertence à loja
  const produto = await prisma.produto.findFirst({
    where: { id: produtoId, lojaId },
    select: { id: true },
  });
  if (!produto) {
    return NextResponse.json({ erro: "Produto não encontrado" }, { status: 404 });
  }

  // Se vier pedidoId, verificar que o cliente realmente comprou este produto
  if (pedidoId) {
    const item = await prisma.itemPedido.findFirst({
      where: { pedidoId, produtoId, pedido: { lojaId, clienteEmail } },
      select: { id: true },
    });
    if (!item) {
      return NextResponse.json({ erro: "Pedido não encontrado para este cliente e produto" }, { status: 403 });
    }
  }

  // Verificar duplicado
  const existente = pedidoId
    ? await prisma.avaliacao.findUnique({ where: { pedidoId_produtoId: { pedidoId, produtoId } } })
    : await prisma.avaliacao.findFirst({ where: { lojaId, produtoId, clienteEmail } });

  if (existente) {
    return NextResponse.json({ erro: "Já avaliou este produto" }, { status: 409 });
  }

  const avaliacao = await prisma.avaliacao.create({
    data: {
      lojaId,
      produtoId,
      pedidoId: pedidoId ?? null,
      clienteEmail,
      clienteNome: clienteNome ?? null,
      estrelas,
      comentario: comentario ?? null,
      aprovada: false, // moderação manual pelo lojista
    },
    select: { id: true },
  });

  return NextResponse.json({ id: avaliacao.id, mensagem: "Avaliação submetida — aguarda aprovação." }, { status: 201 });
}
