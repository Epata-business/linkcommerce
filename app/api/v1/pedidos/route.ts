import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autenticarApiKey } from "@/lib/api-auth";

const STATUS_VALIDOS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"] as const;
type Status = typeof STATUS_VALIDOS[number];

export async function GET(req: NextRequest) {
  const ctx = await autenticarApiKey(req.headers.get("authorization"));
  if (!ctx) return NextResponse.json({ erro: "Chave de API inválida ou inactiva" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const pagina = Math.max(1, parseInt(searchParams.get("pagina") ?? "1", 10));
  const limite = Math.min(100, Math.max(1, parseInt(searchParams.get("limite") ?? "20", 10)));
  const statusParam = searchParams.get("status") as Status | null;
  const desde = searchParams.get("desde");
  const ate = searchParams.get("ate");

  const statusValido = statusParam && STATUS_VALIDOS.includes(statusParam) ? statusParam : undefined;

  const where = {
    lojaId: ctx.lojaId,
    ...(statusValido ? { status: statusValido } : {}),
    ...(desde || ate
      ? {
          createdAt: {
            ...(desde ? { gte: new Date(desde) } : {}),
            ...(ate ? { lte: new Date(ate) } : {}),
          },
        }
      : {}),
  };

  const [total, pedidos] = await Promise.all([
    prisma.pedido.count({ where }),
    prisma.pedido.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * limite,
      take: limite,
      select: {
        id: true,
        status: true,
        clienteEmail: true,
        clienteNome: true,
        subtotal: true,
        desconto: true,
        total: true,
        codigoRastreio: true,
        transportadora: true,
        channel: true,
        createdAt: true,
        itens: {
          select: {
            id: true,
            produtoId: true,
            quantidade: true,
            precoUnitario: true,
            produto: { select: { titulo: true, sku: true } },
            variante: { select: { nomeOpcao: true, sku: true } },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    dados: pedidos.map(p => ({
      ...p,
      subtotal: Number(p.subtotal),
      desconto: Number(p.desconto ?? 0),
      total: Number(p.total),
      itens: p.itens.map(i => ({
        id: i.id,
        produtoId: i.produtoId,
        titulo: i.produto?.titulo,
        sku: i.variante?.sku ?? i.produto?.sku,
        variante: i.variante?.nomeOpcao ?? null,
        quantidade: i.quantidade,
        precoUnitario: Number(i.precoUnitario),
      })),
    })),
    pagina,
    limite,
    total,
    paginas: Math.ceil(total / limite),
  });
}
