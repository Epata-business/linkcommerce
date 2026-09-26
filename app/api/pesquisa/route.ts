import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ pedidos: [], produtos: [], clientes: [] });
  }

  const lojaId = await getLojaId();
  const modo = { contains: q, mode: "insensitive" as const };

  const [pedidos, produtos, clientes] = await Promise.all([
    prisma.pedido.findMany({
      where: {
        lojaId,
        OR: [
          { id: { contains: q } },
          { clienteNome: modo },
          { clienteEmail: modo },
        ],
      },
      select: {
        id: true,
        clienteNome: true,
        clienteEmail: true,
        status: true,
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),

    prisma.produto.findMany({
      where: {
        lojaId,
        OR: [
          { titulo: modo },
          { sku: modo },
        ],
      },
      select: {
        id: true,
        titulo: true,
        preco: true,
        stock: true,
        ativo: true,
        imagemUrl: true,
      },
      take: 5,
    }),

    prisma.cliente.findMany({
      where: {
        lojaId,
        OR: [
          { email: modo },
          { nome: modo },
          { telefone: modo },
        ],
      },
      select: {
        id: true,
        email: true,
        nome: true,
        telefone: true,
      },
      take: 5,
    }),
  ]);

  return NextResponse.json({ pedidos, produtos, clientes });
}
