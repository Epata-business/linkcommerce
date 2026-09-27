import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { enviarEmailConfirmacaoPedido } from "@/lib/email";
import { confirmarVenda } from "@/lib/inventario";
import { criarNotificacao } from "@/lib/notificacoes";
import { criarFatura } from "@/lib/faturas";
import { enviarPushParaLoja } from "@/lib/push";
import { atribuirPontos } from "@/lib/fidelidade";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ erro: "Assinatura inválida" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ recebido: true });
  }

  const session = event.data.object;
  const eventoId = event.id; // ID único do evento Stripe — garante idempotência
  const meta = session.metadata ?? {};
  const pedidoId = meta.pedidoId;
  const lojaId = meta.lojaId;
  const clienteNome = meta.clienteNome ?? "Cliente";
  const carrinhoId = meta.carrinhoId ?? null;

  if (!pedidoId || !lojaId) return NextResponse.json({ recebido: true });

  // Idempotência: se este evento já foi processado, ignorar silenciosamente
  const pagamentoExistente = await prisma.pagamento.findUnique({
    where: { eventoId },
  });
  if (pagamentoExistente?.status === "CONFIRMADO") {
    return NextResponse.json({ recebido: true });
  }

  const pedidoExiste = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      itens: { include: { produto: true } },
      pagamentos: { where: { provedor: "stripe" }, orderBy: { criadoEm: "desc" }, take: 1 },
    },
  });
  if (!pedidoExiste) return NextResponse.json({ recebido: true });

  // Pedido já processado e sem pagamento Stripe pendente → idempotência adicional
  if (pedidoExiste.status === "PROCESSING" && !pagamentoExistente) {
    return NextResponse.json({ recebido: true });
  }

  const loja = await prisma.loja.findUnique({
    where: { id: lojaId },
    include: { utilizadores: { where: { role: "LOJISTA" }, select: { email: true }, take: 1 } },
  });
  if (!loja) return NextResponse.json({ recebido: true });

  const itensReserva = pedidoExiste.itens.map((i) => ({
    produtoId: i.produtoId,
    varianteId: i.varianteId ?? null,
    quantidade: i.quantidade,
  }));

  const pagamentoStripeId = pedidoExiste.pagamentos[0]?.id ?? null;
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;

  await prisma.$transaction(async (tx) => {
    // Actualizar estado do pedido
    await tx.pedido.update({
      where: { id: pedidoId },
      data: { status: "PROCESSING", sincronizadoEm: new Date() },
    });

    // Actualizar ou criar o registo de Pagamento com o eventoId
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
      // Fallback: criar pagamento se não existia (ex: checkout criado antes da migração)
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

    // Confirmar venda: converte reserva em decremento real de stock
    await confirmarVenda(tx, lojaId, pedidoId, itensReserva);
  });

  // Marcar carrinho como convertido
  if (carrinhoId) {
    void prisma.carrinhoAbandonado.update({
      where: { id: carrinhoId },
      data: { status: "CONVERTIDO" },
    }).catch(() => {});
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
  void atribuirPontos({ lojaId, clienteEmail: pedidoExiste.clienteEmail, clienteNome, pedidoId, totalCompra: Number(pedidoExiste.total) });

  const itensEmail = pedidoExiste.itens.map((i) => ({
    produtoId: i.produtoId,
    titulo: i.produto?.titulo ?? "Produto",
    precoUnitario: Number(i.precoUnitario),
    quantidade: i.quantidade,
  }));

  await enviarEmailConfirmacaoPedido({
    nomeLoja: loja.nome,
    clienteNome,
    clienteEmail: pedidoExiste.clienteEmail,
    pedidoId,
    itens: itensEmail,
    total: Number(pedidoExiste.total),
    moeda: loja.moeda ?? "EUR",
    emailLojista: loja.utilizadores[0]?.email ?? undefined,
  });

  void criarFatura({
    lojaId,
    pedidoId,
    subtotal: Number(pedidoExiste.subtotal),
    desconto: Number(pedidoExiste.desconto ?? 0),
    total: Number(pedidoExiste.total),
    moeda: loja.moeda ?? "EUR",
    taxaIva: (loja.moeda ?? "EUR") === "AOA" ? 14 : 23,
    clienteNome,
    clienteEmail: pedidoExiste.clienteEmail,
    lojaNome: loja.nome,
    lojaNif: loja.nif,
    lojaMorada: loja.moradaFiscal,
  });

  return NextResponse.json({ recebido: true });
}
