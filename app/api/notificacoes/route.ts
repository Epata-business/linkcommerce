import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";

// PATCH /api/notificacoes — marcar todas como lidas
export async function PATCH() {
  const lojaId = await getLojaId();
  await prisma.notificacao.updateMany({
    where: { lojaId, lida: false },
    data: { lida: true },
  });
  return NextResponse.json({ ok: true });
}
