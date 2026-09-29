/**
 * POST /api/billing/verificar
 * Re-verifica com a Stripe se existe uma sessão de checkout paga para esta loja.
 * Chamado pelo utilizador quando a subscrição não foi activada automaticamente.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-06-24.dahlia" });

export async function POST() {
  const session = await auth();
  let lojaId = (session?.user as { lojaId?: string })?.lojaId ?? null;
  if (!lojaId && session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { lojaId: true },
    });
    lojaId = dbUser?.lojaId ?? null;
  }
  if (!lojaId) return NextResponse.json({ ok: false, motivo: "sem-loja" });

  const subAtual = await prisma.subscricao.findUnique({
    where: { lojaId },
    select: { status: true, stripeCustomerId: true },
  });

  if (subAtual?.status === "ATIVA") {
    return NextResponse.json({ ok: true, jaAtiva: true });
  }

  // Pesquisar as últimas sessões de checkout pagas na Stripe para este lojaId
  // Filtrar por customer quando possível (mais eficiente e seguro)
  try {
    const listParams: Parameters<typeof stripe.checkout.sessions.list>[0] = { limit: 10 };
    if (subAtual?.stripeCustomerId) listParams.customer = subAtual.stripeCustomerId;
    const sessions = await stripe.checkout.sessions.list(listParams);

    for (const cs of sessions.data) {
      if (
        cs.metadata?.lojaId === lojaId &&
        cs.payment_status === "paid" &&
        cs.mode === "subscription" &&
        cs.subscription
      ) {
        const planoId = cs.metadata?.planoId;
        if (!planoId) continue;

        const sub = await stripe.subscriptions.retrieve(cs.subscription as string);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const proximaCobranca = new Date(((sub as any).current_period_end as number) * 1000);

        await prisma.subscricao.upsert({
          where: { lojaId },
          update: {
            planoId,
            stripeCustomerId: cs.customer as string,
            stripeSubscriptionId: sub.id,
            status: "ATIVA",
            proximaCobranca,
          },
          create: {
            lojaId,
            planoId,
            stripeCustomerId: cs.customer as string,
            stripeSubscriptionId: sub.id,
            status: "ATIVA",
            proximaCobranca,
          },
        });
        await prisma.loja.update({ where: { id: lojaId }, data: { planoId } });

        return NextResponse.json({ ok: true, ativada: true });
      }
    }
  } catch (err) {
    console.error("[billing/verificar] erro Stripe:", err);
    return NextResponse.json({ ok: false, motivo: "stripe-error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ativada: false });
}
