import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";

export async function GET() {
  const lojaId = await getLojaId();
  const loja = await prisma.loja.findUnique({
    where: { id: lojaId },
    select: { subdominio: true, nome: true, dominioProprio: true },
  });
  if (!loja) return NextResponse.json({ erro: "Loja não encontrada" }, { status: 404 });

  const url = loja.dominioProprio
    ? `https://${loja.dominioProprio}`
    : `https://${loja.subdominio}.linkcommerce.app`;

  return NextResponse.json({ subdominio: loja.subdominio, nome: loja.nome, url });
}
