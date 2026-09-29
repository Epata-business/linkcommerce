/**
 * POST /api/billing/cancelar
 * Cancela a subscrição do lojista autenticado.
 * - Stripe: cancela no fim do período corrente (cancel_at_period_end)
 * - AOA / manual: marca como CANCELADA imediatamente
 * O lojista mantém acesso até ao fim do período pago.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { registarAudit } from "@/lib/audit";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  let lojaId = (session.user as { lojaId?: string }).lojaId ?? null;
  if (!lojaId && session.user.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { lojaId: true, role: true },
    });
    if (dbUser?.role !== "LOJISTA") {
      return NextResponse.json({ erro: "Apenas o proprietário pode cancelar a subscrição." }, { status: 403 });
    }
    lojaId = dbUser?.lojaId ?? null;
  }
  if (!lojaId) return NextResponse.json({ erro: "Loja não encontrada." }, { status: 404 });

  const subscricao = await prisma.subscricao.findUnique({
    where: { lojaId },
    select: { id: true, status: true, stripeSubscriptionId: true },
  });

  if (!subscricao) {
    return NextResponse.json({ erro: "Sem subscrição activa." }, { status: 404 });
  }
  if (subscricao.status === "CANCELADA") {
    return NextResponse.json({ erro: "A subscrição já está cancelada." }, { status: 409 });
  }

  if (subscricao.stripeSubscriptionId) {
    // Stripe: cancelar no fim do período (acesso mantido até lá)
    try {
      await stripe.subscriptions.update(subscricao.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    } catch (err) {
      console.error("[billing/cancelar] Stripe error:", err);
      return NextResponse.json({ erro: "Erro ao cancelar no Stripe. Tente novamente ou contacte o suporte." }, { status: 500 });
    }
    await prisma.subscricao.update({
      where: { lojaId },
      data: { status: "CANCELADA" },
    });
  } else {
    // AOA / manual: cancelar imediatamente
    await prisma.subscricao.update({
      where: { lojaId },
      data: { status: "CANCELADA" },
    });
  }

  void registarAudit({
    lojaId,
    userId: (session.user as { id?: string }).id,
    userEmail: session.user.email ?? undefined,
    acao: "CANCELAR",
    entidade: "Subscricao",
    valoresAntigos: { status: subscricao.status },
    valoresNovos: { status: "CANCELADA" },
  });

  return NextResponse.json({ ok: true });
}
