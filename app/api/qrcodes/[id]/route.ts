import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const lojaId = await getLojaId();
  const { nome, destino, ativo } = await req.json();

  const qr = await prisma.qrCode.findUnique({ where: { id: params.id } });
  if (!qr || qr.lojaId !== lojaId) {
    return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  }

  const updated = await prisma.qrCode.update({
    where: { id: params.id },
    data: {
      ...(nome !== undefined ? { nome: nome.trim() } : {}),
      ...(destino !== undefined ? { destino: destino.trim() } : {}),
      ...(ativo !== undefined ? { ativo } : {}),
    },
  });

  return NextResponse.json({ qr: updated });
}
