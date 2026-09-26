import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const lojaId = (session?.user as { lojaId?: string })?.lojaId;
  if (!session?.user || !lojaId) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const [loja, produtos] = await Promise.all([
    prisma.loja.findUnique({ where: { id: lojaId }, select: { moeda: true } }),
    prisma.produto.findMany({
      where: { lojaId },
      orderBy: { createdAt: "desc" },
      include: {
        variantes: { select: { nomeOpcao: true, stock: true, precoExtra: true } },
        itensPedido: { select: { id: true } },
      },
    }),
  ]);

  const moeda = loja?.moeda ?? "EUR";

  const linhas: string[] = [
    ["ID", "Título", "Preço", "Moeda", "Stock", "Stock Mínimo", "Ativo", "Variantes", "Total Vendido", "Criado em"].join(";"),
  ];

  for (const p of produtos) {
    const variantesStr = p.variantes.length > 0
      ? `"${p.variantes.map(v => `${v.nomeOpcao}:${v.stock}`).join(" | ")}"`
      : "";
    linhas.push([
      p.id,
      `"${p.titulo}"`,
      Number(p.preco).toFixed(2),
      moeda,
      p.stock.toString(),
      (p.stockMinimo ?? 0).toString(),
      p.ativo ? "Sim" : "Não",
      variantesStr,
      p.itensPedido.length.toString(),
      new Date(p.createdAt).toLocaleDateString("pt-AO"),
    ].join(";"));
  }

  const csv = "﻿" + linhas.join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="produtos-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
