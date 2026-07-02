import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.lojaId) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const lojaId = session.user.lojaId as string;
  const { searchParams } = req.nextUrl;
  const desde = searchParams.get("desde");
  const ate = searchParams.get("ate");

  const pedidos = await prisma.pedido.findMany({
    where: {
      lojaId,
      ...(desde || ate ? {
        createdAt: {
          ...(desde ? { gte: new Date(desde) } : {}),
          ...(ate ? { lte: new Date(ate + "T23:59:59") } : {}),
        },
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      itens: { include: { produto: { select: { titulo: true } } } },
    },
  });

  const loja = await prisma.loja.findUnique({ where: { id: lojaId }, select: { moeda: true } });
  const moeda = loja?.moeda ?? "EUR";

  const linhas: string[] = [
    ["Nº Pedido", "Data", "Cliente", "Email", "Produtos", "Total", "Moeda", "Estado", "Canal", "Método Pagamento"].join(";"),
  ];

  for (const p of pedidos) {
    const moradaJson = (p.morada ?? {}) as Record<string, string>;
    const produtos = p.itens.map(i => `${i.produto?.titulo ?? "?"}×${i.quantidade}`).join(" | ");
    linhas.push([
      `#${p.id.slice(-8).toUpperCase()}`,
      new Date(p.createdAt).toLocaleDateString("pt-AO"),
      p.clienteNome,
      p.clienteEmail,
      `"${produtos}"`,
      Number(p.total).toFixed(2),
      moeda,
      p.status,
      p.channel ?? "ONLINE",
      moradaJson.metodoPagamento ?? "—",
    ].join(";"));
  }

  const csv = "﻿" + linhas.join("\r\n"); // BOM para Excel reconhecer UTF-8

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
