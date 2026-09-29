/**
 * GET /api/cron/expirar-trials
 * Marca subscrições TRIAL expiradas como EM_FALTA.
 * Chamado diariamente via Vercel Cron / cron externo com Bearer CRON_SECRET.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const agora = new Date();

  const expiradas = await prisma.subscricao.updateMany({
    where: {
      status: "TRIAL",
      trialFimEm: { lt: agora },
    },
    data: { status: "EM_FALTA" },
  });

  return NextResponse.json({ ok: true, expiradas: expiradas.count });
}
