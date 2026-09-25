import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { randomBytes } from "crypto";

function gerarSlug() {
  return randomBytes(3).toString("hex"); // 6 chars hex, ex: "a3f9c2"
}

export async function POST(req: NextRequest) {
  const lojaId = await getLojaId();
  const { nome, destino } = await req.json();

  if (!nome?.trim() || !destino?.trim()) {
    return NextResponse.json({ erro: "Nome e destino são obrigatórios" }, { status: 400 });
  }

  // Slug único — retry em caso de colisão (extremamente improvável)
  let slug = gerarSlug();
  for (let i = 0; i < 5; i++) {
    const existe = await prisma.qrCode.findUnique({ where: { slug } });
    if (!existe) break;
    slug = gerarSlug();
  }

  const qr = await prisma.qrCode.create({
    data: { lojaId, slug, nome: nome.trim(), destino: destino.trim() },
  });

  return NextResponse.json({ qr });
}
