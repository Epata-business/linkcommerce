import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-06-24.dahlia" });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  // JWT pode estar desactualizado — fallback à DB
  let lojaId = (session.user as { lojaId?: string }).lojaId ?? null;
  if (!lojaId && session.user.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { lojaId: true },
    });
    lojaId = dbUser?.lojaId ?? null;
  }
  if (!lojaId) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { planoId } = await req.json();

  const [plano, loja] = await Promise.all([
    prisma.plano.findUnique({ where: { id: planoId } }),
    prisma.loja.findUnique({
      where: { id: lojaId },
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
      metadata: { lojaId },
    });
    stripeCustomerId = customer.id;
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: plano.stripePriceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/subscrever?sucesso=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/subscrever`,
    metadata: { lojaId, planoId },
    subscription_data: { metadata: { lojaId, planoId } },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
