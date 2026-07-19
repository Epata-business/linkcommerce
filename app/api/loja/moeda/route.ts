import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";

const VALID = ["EUR", "USD", "AOA"];

export async function PATCH(req: Request) {
  const { moeda } = await req.json();
  if (!VALID.includes(moeda)) return NextResponse.json({ erro: "moeda-invalida" }, { status: 400 });

  const lojaId = await getLojaId();
  if (!lojaId) return NextResponse.json({ erro: "nao-autenticado" }, { status: 401 });

  await prisma.loja.update({ where: { id: lojaId }, data: { moeda } });
  return NextResponse.json({ ok: true });
}
