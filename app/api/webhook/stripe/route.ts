import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { enviarEmailConfirmacaoPedido } from "@/lib/email";
import { randomUUID } from "crypto";

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
  const meta = session.metadata ?? {};
  const pedidoId = meta.pedidoId;
  const lojaId = meta.lojaId;
  const clienteNome = meta.clienteNome ?? "Cliente";

  if (!pedidoId || !lojaId) return NextResponse.json({ recebido: true });

  // Idempotência — verificar se já foi processado
  const pedidoExiste = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: { itens: { include: { produto: true } } },
  });
  if (!pedidoExiste) return NextResponse.json({ recebido: true });
  if (pedidoExiste.status === "PROCESSING") return NextResponse.json({ recebido: true });

  const loja = await prisma.loja.findUnique({
    where: { id: lojaId },
    include: { utilizadores: { where: { role: "LOJISTA" }, select: { email: true }, take: 1 } },
  });
  if (!loja) return NextResponse.json({ recebido: true });

  // Actualizar pedido para PROCESSING e decrementar stock
  const pedido = await prisma.$transaction(async (tx) => {
    const p = await tx.pedido.update({
      where: { id: pedidoId },
      data: {
        status: "PROCESSING",
        sincronizadoEm: new Date(),
      },
    });

    // Decrementar stock
    for (const item of pedidoExiste.itens) {
      if (item.varianteId) {
        await tx.variante.updateMany({
          where: { id: item.varianteId, stock: { gt: 0 } },
          data: { stock: { decrement: item.quantidade } },
        });
      } else {
        await tx.produto.updateMany({
          where: { id: item.produtoId, stock: { gt: 0 } },
          data: { stock: { decrement: item.quantidade } },
        });
      }
    }

    return p;
  });

  const itensEmail = pedidoExiste.itens.map((i) => ({
    produtoId: i.produtoId,
    titulo: i.produto?.titulo ?? "Produto",
    precoUnitario: Number(i.precoUnitario),
    quantidade: i.quantidade,
  }));
  const total = Number(pedidoExiste.total);

  // Enviar emails
  await enviarEmailConfirmacaoPedido({
    nomeLoja: loja.nome,
    clienteNome,
    clienteEmail: pedidoExiste.clienteEmail,
    pedidoId: pedido.id,
    itens: itensEmail,
    total,
    moeda: loja.moeda ?? "EUR",
    emailLojista: loja.utilizadores[0]?.email ?? undefined,
  });

  return NextResponse.json({ recebido: true });
}
