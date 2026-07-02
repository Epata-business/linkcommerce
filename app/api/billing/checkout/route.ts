import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-06-24.dahlia" });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.lojaId) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { planoId } = await req.json();

  const [plano, loja] = await Promise.all([
    prisma.plano.findUnique({ where: { id: planoId } }),
    prisma.loja.findUnique({
      where: { id: session.user.lojaId },
      include: { subscricao: true },
    }),
  ]);

  if (!plano) return NextResponse.json({ erro: "Plano não encontrado" }, { status: 404 });
  if (!plano.stripePriceId) return NextResponse.json({ erro: "Plano gratuito, sem checkout" }, { status: 400 });

  // Criar ou recuperar Stripe Customer
  let stripeCustomerId = loja?.subscricao?.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      name: loja?.nome ?? undefined,
      metadata: { lojaId: session.user.lojaId },
    });
    stripeCustomerId = customer.id;
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: plano.stripePriceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard/configuracoes/planos?sucesso=1`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/configuracoes/planos`,
    metadata: { lojaId: session.user.lojaId, planoId },
    subscription_data: { metadata: { lojaId: session.user.lojaId, planoId } },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
