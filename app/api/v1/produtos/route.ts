import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autenticarApiKey } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const ctx = await autenticarApiKey(req.headers.get("authorization"));
  if (!ctx) return NextResponse.json({ erro: "Chave de API inválida ou inactiva" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const pagina = Math.max(1, parseInt(searchParams.get("pagina") ?? "1", 10));
  const limite = Math.min(100, Math.max(1, parseInt(searchParams.get("limite") ?? "20", 10)));
  const ativo = searchParams.get("ativo");

  const where = {
    lojaId: ctx.lojaId,
    ...(ativo !== null ? { ativo: ativo !== "false" } : {}),
  };

  const [total, produtos] = await Promise.all([
    prisma.produto.count({ where }),
    prisma.produto.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * limite,
      take: limite,
      select: {
        id: true,
        titulo: true,
        descricao: true,
        preco: true,
        sku: true,
        imagemUrl: true,
        stock: true,
        stockReservado: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
        variantes: {
          select: { id: true, nomeOpcao: true, precoExtra: true, sku: true, stock: true, stockReservado: true },
        },
      },
    }),
  ]);

  return NextResponse.json({
    dados: produtos.map(p => ({
      ...p,
      preco: Number(p.preco),
      stockDisponivel: p.stock - p.stockReservado,
      variantes: p.variantes.map(v => ({
        ...v,
        precoExtra: Number(v.precoExtra),
        stockDisponivel: v.stock - v.stockReservado,
      })),
    })),
    pagina,
    limite,
    total,
    paginas: Math.ceil(total / limite),
  });
}
