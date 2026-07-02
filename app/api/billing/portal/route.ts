import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-06-24.dahlia" });

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.lojaId) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const subscricao = await prisma.subscricao.findUnique({
    where: { lojaId: session.user.lojaId },
  });

  if (!subscricao?.stripeCustomerId) {
    return NextResponse.json({ erro: "Sem subscrição activa" }, { status: 400 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscricao.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/dashboard/configuracoes/planos`,
  });

  return NextResponse.json({ url: portalSession.url });
}
