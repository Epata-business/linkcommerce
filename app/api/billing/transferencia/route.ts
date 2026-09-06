import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.lojaId) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { planoId, comprovanteUrl } = await req.json();
  if (!planoId || !comprovanteUrl) {
    return NextResponse.json({ erro: "planoId e comprovanteUrl são obrigatórios" }, { status: 400 });
  }

  const plano = await prisma.plano.findUnique({ where: { id: planoId } });
  if (!plano) return NextResponse.json({ erro: "Plano não encontrado" }, { status: 404 });

  await prisma.subscricao.upsert({
    where: { lojaId: session.user.lojaId },
    update: {
      planoId,
      comprovanteUrl,
      moedaPagamento: "AOA",
      status: "PENDENTE_TRANSFERENCIA",
    },
    create: {
      lojaId: session.user.lojaId,
      planoId,
      comprovanteUrl,
      moedaPagamento: "AOA",
      status: "PENDENTE_TRANSFERENCIA",
    },
  });

  return NextResponse.json({ ok: true });
}
