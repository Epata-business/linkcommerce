import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { enviarEmailConfirmacaoPedido, notificarNovaSubscricao } from "@/lib/email";
import { confirmarVenda } from "@/lib/inventario";
import { criarNotificacao } from "@/lib/notificacoes";
import { criarFatura } from "@/lib/faturas";
import { enviarPushParaLoja } from "@/lib/push";
import { atribuirPontos } from "@/lib/fidelidade";

// Endpoint único para todos os eventos Stripe.
// Registar um único webhook no dashboard Stripe:
//   URL: https://<dominio>/api/webhook/stripe
//   Eventos: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
// Variável de ambiente: STRIPE_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[webhook/stripe] assinatura inválida:", String(err).slice(0, 120));
    return NextResponse.json({ erro: "Assinatura inválida" }, { status: 400 });
  }

  // ── checkout.session.completed ──────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Subscrição de plano (billing)
    if (session.mode === "subscription") {
      await handleBillingCheckout(session);
      return NextResponse.json({ recebido: true });
    }

    // Pagamento de pedido de loja (checkout de produto)
    const meta = session.metadata ?? {};
    const pedidoId = meta.pedidoId;
    const lojaId = meta.lojaId;
    if (pedidoId && lojaId) {
      await handleOrderCheckout(event.id, session, pedidoId, lojaId, meta);
    }

    return NextResponse.json({ recebido: true });
  }

  // ── customer.subscription.updated ──────────────────────────────────────────
  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription & { current_period_end: number };
    const lojaId = sub.metadata?.lojaId;
    if (lojaId) {
      const status =
        sub.status === "active" ? "ATIVA" : sub.status === "past_due" ? "EM_FALTA" : "CANCELADA";
      const proximaCobranca = new Date(sub.current_period_end * 1000);
      await prisma.subscricao.update({ where: { lojaId }, data: { status, proximaCobranca } });
    }
    return NextResponse.json({ recebido: true });
  }

  // ── customer.subscription.deleted ──────────────────────────────────────────
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const lojaId = sub.metadata?.lojaId;
    if (lojaId) {
      const planoFree = await prisma.plano.findFirst({ where: { slug: "free" } });
      if (planoFree) {
        await prisma.subscricao.update({
          where: { lojaId },
          data: { status: "CANCELADA", planoId: planoFree.id },
        });
        await prisma.loja.update({ where: { id: lojaId }, data: { planoId: planoFree.id } });
      }
    }
    return NextResponse.json({ recebido: true });
  }

  return NextResponse.json({ recebido: true });
}

// ── Handlers internos ────────────────────────────────────────────────────────

async function handleBillingCheckout(session: Stripe.Checkout.Session) {
  const lojaId = session.metadata?.lojaId;
  const planoId = session.metadata?.planoId;
  const stripeSubscriptionId = session.subscription as string;
  const stripeCustomerId = session.customer as string;

  if (!lojaId || !planoId) return;

  const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const proximaCobranca = new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000);

  await prisma.subscricao.upsert({
    where: { lojaId },
    update: { planoId, stripeCustomerId, stripeSubscriptionId, status: "ATIVA", proximaCobranca },
    create: { lojaId, planoId, stripeCustomerId, stripeSubscriptionId, status: "ATIVA", proximaCobranca },
  });
  await prisma.loja.update({ where: { id: lojaId }, data: { planoId } });

  const [loja, plano] = await Promise.all([
    prisma.loja.findUnique({ where: { id: lojaId }, select: { nome: true } }),
    prisma.plano.findUnique({ where: { id: planoId }, select: { nome: true, precoMensal: true } }),
  ]);
  if (loja && plano) {
    await notificarNovaSubscricao({
      nomeLoja: loja.nome,
      nomePlano: plano.nome,
      valor: Number(plano.precoMensal),
      moeda: "EUR",
      stripeCustomerId,
    });
  }
}

async function handleOrderCheckout(
  eventoId: string,
  session: Stripe.Checkout.Session,
  pedidoId: string,
  lojaId: string,
  meta: Record<string, string>,
) {
  const clienteNome = meta.clienteNome ?? "Cliente";
  const carrinhoId = meta.carrinhoId ?? null;

  // Idempotência por eventoId
  const pagamentoExistente = await prisma.pagamento.findUnique({ where: { eventoId } });
  if (pagamentoExistente?.status === "CONFIRMADO") return;

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      itens: { include: { produto: true } },
      pagamentos: { where: { provedor: "stripe" }, orderBy: { criadoEm: "desc" }, take: 1 },
    },
  });
  if (!pedido) return;

  if (pedido.status === "PROCESSING" && !pagamentoExistente) return;

  const loja = await prisma.loja.findUnique({
    where: { id: lojaId },
    include: { utilizadores: { where: { role: "LOJISTA" }, select: { email: true }, take: 1 } },
  });
  if (!loja) return;

  const itensReserva = pedido.itens.map((i) => ({
    produtoId: i.produtoId,
    varianteId: i.varianteId ?? null,
    quantidade: i.quantidade,
  }));

  const pagamentoStripeId = pedido.pagamentos[0]?.id ?? null;
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : null;

  await prisma.$transaction(async (tx) => {
    await tx.pedido.update({
      where: { id: pedidoId },
      data: { status: "PROCESSING", sincronizadoEm: new Date() },
    });

    if (pagamentoStripeId) {
      await tx.pagamento.update({
        where: { id: pagamentoStripeId },
        data: {
          status: "CONFIRMADO",
          referencia: paymentIntentId ?? session.id,
          eventoId,
          metadata: { stripeSessionId: session.id, paymentIntent: paymentIntentId },
        },
      });
    } else {
      await tx.pagamento.create({
        data: {
          lojaId,
          pedidoId,
          metodo: "CARTAO",
          status: "CONFIRMADO",
          valor: (session.amount_total ?? 0) / 100,
          moeda: (session.currency ?? "eur").toUpperCase(),
          referencia: paymentIntentId ?? session.id,
          provedor: "stripe",
          eventoId,
          metadata: { stripeSessionId: session.id, paymentIntent: paymentIntentId },
        },
      });
    }

    await confirmarVenda(tx, lojaId, pedidoId, itensReserva);
  });

  if (carrinhoId) {
    void prisma.carrinhoAbandonado
      .update({ where: { id: carrinhoId }, data: { status: "CONVERTIDO" } })
      .catch(() => {});
  }

  void criarNotificacao({
    lojaId,
    tipo: "pagamento_confirmado",
    titulo: "Pagamento confirmado",
    mensagem: `Pedido #${pedidoId.slice(-8).toUpperCase()} de ${clienteNome} foi pago via Stripe.`,
    link: `/dashboard/pedidos/${pedidoId}`,
    pedidoId,
  });
  void enviarPushParaLoja(lojaId, {
    title: `🛒 Novo pedido — pagamento confirmado`,
    body: `${clienteNome} · Stripe · #${pedidoId.slice(-8).toUpperCase()}`,
    url: `/dashboard/pedidos/${pedidoId}`,
  });
  void atribuirPontos({
    lojaId,
    clienteEmail: pedido.clienteEmail,
    clienteNome,
    pedidoId,
    totalCompra: Number(pedido.total),
  });

  const itensEmail = pedido.itens.map((i) => ({
    produtoId: i.produtoId,
    titulo: i.produto?.titulo ?? "Produto",
    precoUnitario: Number(i.precoUnitario),
    quantidade: i.quantidade,
  }));

  await enviarEmailConfirmacaoPedido({
    nomeLoja: loja.nome,
    clienteNome,
    clienteEmail: pedido.clienteEmail,
    pedidoId,
    itens: itensEmail,
    total: Number(pedido.total),
    moeda: loja.moeda ?? "EUR",
    emailLojista: loja.utilizadores[0]?.email ?? undefined,
  });

  void criarFatura({
    lojaId,
    pedidoId,
    subtotal: Number(pedido.subtotal),
    desconto: Number(pedido.desconto ?? 0),
    total: Number(pedido.total),
    moeda: loja.moeda ?? "EUR",
    taxaIva: (loja.moeda ?? "EUR") === "AOA" ? 14 : 23,
    clienteNome,
    clienteEmail: pedido.clienteEmail,
    lojaNome: loja.nome,
    lojaNif: loja.nif,
    lojaMorada: loja.moradaFiscal,
  });
}
