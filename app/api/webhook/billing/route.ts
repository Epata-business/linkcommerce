import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-06-24.dahlia" });
const webhookSecret = process.env.STRIPE_BILLING_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ erro: "Assinatura inválida" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== "subscription") return NextResponse.json({ ok: true });

    const lojaId = session.metadata?.lojaId;
    const planoId = session.metadata?.planoId;
    const stripeSubscriptionId = session.subscription as string;
    const stripeCustomerId = session.customer as string;

    if (!lojaId || !planoId) return NextResponse.json({ ok: true });

    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proximaCobranca = new Date(((sub as any).current_period_end as number) * 1000);

    await prisma.subscricao.upsert({
      where: { lojaId },
      update: { planoId, stripeCustomerId, stripeSubscriptionId, status: "ATIVA", proximaCobranca },
      create: { lojaId, planoId, stripeCustomerId, stripeSubscriptionId, status: "ATIVA", proximaCobranca },
    });
    await prisma.loja.update({ where: { id: lojaId }, data: { planoId } });
  }

  if (event.type === "customer.subscription.updated") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = event.data.object as any as Stripe.Subscription & { current_period_end: number };
    const lojaId = sub.metadata?.lojaId;
    if (!lojaId) return NextResponse.json({ ok: true });

    const status = sub.status === "active" ? "ATIVA" : sub.status === "past_due" ? "EM_FALTA" : "CANCELADA";
    const proximaCobranca = new Date(sub.current_period_end * 1000);
    await prisma.subscricao.update({ where: { lojaId }, data: { status, proximaCobranca } });
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const lojaId = sub.metadata?.lojaId;
    if (!lojaId) return NextResponse.json({ ok: true });

    // Downgrade para plano Free
    const planoFree = await prisma.plano.findFirst({ where: { slug: "free" } });
    if (planoFree) {
      await prisma.subscricao.update({ where: { lojaId }, data: { status: "CANCELADA", planoId: planoFree.id } });
      await prisma.loja.update({ where: { id: lojaId }, data: { planoId: planoFree.id } });
    }
  }

  return NextResponse.json({ ok: true });
}
