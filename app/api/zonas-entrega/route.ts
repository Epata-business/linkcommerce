import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";

export async function GET() {
  const lojaId = await getLojaId();
  if (!lojaId) return NextResponse.json({ erro: "nao-autenticado" }, { status: 401 });
  const zonas = await prisma.zonaEntrega.findMany({
    where: { lojaId },
    orderBy: { ordem: "asc" },
  });
  return NextResponse.json(zonas);
}

export async function POST(req: Request) {
  const lojaId = await getLojaId();
  if (!lojaId) return NextResponse.json({ erro: "nao-autenticado" }, { status: 401 });
  const { nome, preco, prazo } = await req.json();
  if (!nome || preco == null) return NextResponse.json({ erro: "campos-obrigatorios" }, { status: 400 });
  const count = await prisma.zonaEntrega.count({ where: { lojaId } });
  const zona = await prisma.zonaEntrega.create({
    data: { lojaId, nome, preco, prazo: prazo || null, ordem: count },
  });
  return NextResponse.json(zona);
}

export async function DELETE(req: Request) {
  const lojaId = await getLojaId();
  if (!lojaId) return NextResponse.json({ erro: "nao-autenticado" }, { status: 401 });
  const { id } = await req.json();
  await prisma.zonaEntrega.deleteMany({ where: { id, lojaId } });
  return NextResponse.json({ ok: true });
}
