import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type ClienteRow = {
  clienteEmail: string;
  nome: string | null;
  total_pedidos: bigint;
  total_gasto: string;
  primeiro_pedido: Date;
  ultimo_pedido: Date;
};

export async function GET(req: NextRequest) {
  const session = await auth();
  const lojaId = (session?.user as { lojaId?: string })?.lojaId;
  if (!session?.user || !lojaId) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const desde = req.nextUrl.searchParams.get("desde");
  const ate = req.nextUrl.searchParams.get("ate");

  // Build date filter fragment
  const filtroDesde = desde ? Prisma.sql`AND "createdAt" >= ${new Date(desde)}` : Prisma.empty;
  const filtroAte = ate ? Prisma.sql`AND "createdAt" <= ${new Date(ate + "T23:59:59")}` : Prisma.empty;

  const clientesRaw = await prisma.$queryRaw<ClienteRow[]>`
    SELECT
      "clienteEmail",
      MAX("clienteNome") AS nome,
      COUNT(*)::bigint AS total_pedidos,
      SUM(total)::text AS total_gasto,
      MIN("createdAt") AS primeiro_pedido,
      MAX("createdAt") AS ultimo_pedido
    FROM pedidos
    WHERE "lojaId" = ${lojaId}
      AND status != 'CANCELLED'
      ${filtroDesde}
      ${filtroAte}
    GROUP BY "clienteEmail"
    ORDER BY MAX("createdAt") DESC
  `;

  const loja = await prisma.loja.findUnique({ where: { id: lojaId }, select: { moeda: true } });
  const moeda = loja?.moeda ?? "EUR";

  const agora = Date.now();
  function segmento(numPedidos: number, diasDesdeUltimo: number): string {
    if (diasDesdeUltimo > 90) return "Inativo";
    if (numPedidos >= 5) return "VIP";
    if (numPedidos >= 2) return "Recorrente";
    return "Novo";
  }

  const linhas: string[] = [
    ["Email", "Nome", "Nº Pedidos", "Total Gasto", "Moeda", "Segmento", "Primeiro Pedido", "Último Pedido"].join(";"),
  ];

  for (const c of clientesRaw) {
    const dias = Math.floor((agora - new Date(c.ultimo_pedido).getTime()) / 86_400_000);
    const num = Number(c.total_pedidos);
    linhas.push([
      c.clienteEmail,
      c.nome ?? "",
      num.toString(),
      parseFloat(c.total_gasto ?? "0").toFixed(2),
      moeda,
      segmento(num, dias),
      new Date(c.primeiro_pedido).toLocaleDateString("pt-AO"),
      new Date(c.ultimo_pedido).toLocaleDateString("pt-AO"),
    ].join(";"));
  }

  const csv = "﻿" + linhas.join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
