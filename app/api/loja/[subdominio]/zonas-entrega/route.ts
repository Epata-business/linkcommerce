import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { subdominio: string } }) {
  const loja = await prisma.loja.findUnique({
    where: { subdominio: params.subdominio },
    select: { id: true },
  });
  if (!loja) return NextResponse.json([]);
  const zonas = await prisma.zonaEntrega.findMany({
    where: { lojaId: loja.id, ativo: true },
    orderBy: { ordem: "asc" },
    select: { id: true, nome: true, preco: true, prazo: true },
  });
  return NextResponse.json(zonas);
}
