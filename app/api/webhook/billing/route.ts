import { NextResponse } from "next/server";

// Este endpoint foi consolidado em /api/webhook/stripe.
// Se ainda estiver registado no Stripe, pode ser removido do dashboard.
export async function POST() {
  return NextResponse.json({ recebido: true });
}
