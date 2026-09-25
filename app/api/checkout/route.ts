import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { enviarEmailConfirmacaoPedido } from "@/lib/email";
import { reservarStock } from "@/lib/inventario";
import { z } from "zod";
import { randomUUID } from "crypto";

const ItemSchema = z.object({
  produtoId: z.string(),
  varianteId: z.string().optional(),
  titulo: z.string(),
  precoUnitario: z.number().positive(),
  quantidade: z.number().int().positive(),
  imagemUrl: z.string().nullable().optional(),
});

const MoradaSchema = z.object({
  rua: z.string().optional(),
  cidade: z.string().optional(),
  codigoPostal: z.string().optional(),
  pais: z.string().optional(),
});

const CheckoutSchema = z.object({
  subdominio: z.string(),
  itens: z.array(ItemSchema).min(1),
  clienteEmail: z.string().email(),
  clienteNome: z.string().min(1),
  clienteTelefone: z.string().optional(),
  morada: MoradaSchema.optional(),
  metodoPagamento: z.enum(["cartao", "mbway", "multibanco", "multicaixa", "paypal"]).default("cartao"),
  comprovanteUrl: z.string().url().optional(),
  zonaEntregaId: z.string().optional(),
});

// Mapeia o método do checkout para o enum MetodoPagamento do schema
const METODO_MAP = {
  cartao:     "CARTAO",
  mbway:      "MBWAY",
  multibanco: "MULTIBANCO",
  multicaixa: "MULTICAIXA",
  paypal:     "PAYPAL",
} as const;

type StripePaymentMethod = "card" | "paypal" | "mb_way" | "multibanco";

const METODO_STRIPE_MAP: Record<string, StripePaymentMethod[]> = {
  cartao:     ["card"],
  mbway:      ["mb_way"],
  multibanco: ["multibanco"],
  paypal:     ["paypal"],
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });

  const {
    subdominio, itens, clienteEmail, clienteNome, clienteTelefone,
    morada, metodoPagamento, comprovanteUrl, zonaEntregaId,
  } = parsed.data;

  const loja = await prisma.loja.findUnique({
    where: { subdominio, publicada: true },
    include: { utilizadores: { where: { role: "LOJISTA" }, select: { email: true }, take: 1 } },
  });
  if (!loja) return NextResponse.json({ erro: "Loja não encontrada" }, { status: 404 });

  const moedaLoja = loja.moeda ?? "AOA";
  const moedaStripe = moedaLoja.toLowerCase();
  const clientUuid = randomUUID();
  const total = itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
  const origin = req.nextUrl.origin;
  const metodoPagamentoEnum = METODO_MAP[metodoPagamento] ?? "DESCONHECIDO";

  const itensReserva = itens.map((i) => ({
    produtoId: i.produtoId,
    varianteId: i.varianteId ?? null,
    quantidade: i.quantidade,
  }));

  // --------------------------------------------------------------------------
  // Modo sem Stripe (dev / sem chaves configuradas) — criar pedido directo
  // --------------------------------------------------------------------------
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
    let pedido;
    try {
      pedido = await prisma.$transaction(async (tx) => {
        const p = await tx.pedido.create({
          data: {
            lojaId: loja.id,
            clienteEmail,
            clienteNome,
            morada: { ...morada, clienteTelefone: clienteTelefone ?? null },
            subtotal: total,
            desconto: 0,
            total,
            status: "PENDING",
            channel: "ONLINE",
            clientUuid,
            itens: {
              create: itens.map((i) => ({
                produtoId: i.produtoId,
                varianteId: i.varianteId ?? null,
                quantidade: i.quantidade,
                precoUnitario: i.precoUnitario,
              })),
            },
          },
        });
        await tx.pagamento.create({
          data: {
            lojaId: loja.id,
            pedidoId: p.id,
            metodo: "DESCONHECIDO",
            status: "CONFIRMADO", // dev mode: assume confirmado
            valor: total,
            moeda: moedaLoja,
            provedor: "manual",
          },
        });
        await reservarStock(tx, loja.id, p.id, itensReserva);
        return p;
      }, { isolationLevel: "Serializable" });
    } catch (err) {
      if (String(err).includes("STOCK_INSUFICIENTE")) {
        return NextResponse.json({ erro: "Um ou mais produtos não têm stock disponível." }, { status: 409 });
      }
      throw err;
    }
    return NextResponse.json({
      modo: "directo",
      pedidoId: pedido.id,
      redirectUrl: `/loja/${subdominio}/pedido/${pedido.id}/sucesso`,
    });
  }

  // --------------------------------------------------------------------------
  // Multicaixa Express — sem Stripe, pagamento manual confirmado pelo lojista
  // --------------------------------------------------------------------------
  if (metodoPagamento === "multicaixa") {
    let pedido;
    try {
      pedido = await prisma.$transaction(async (tx) => {
        const p = await tx.pedido.create({
          data: {
            lojaId: loja.id,
            clienteEmail,
            clienteNome,
            morada: { ...morada, clienteTelefone: clienteTelefone ?? null },
            subtotal: total,
            desconto: 0,
            total,
            status: "PENDING",
            channel: "ONLINE",
            clientUuid,
            zonaEntregaId: zonaEntregaId ?? null,
            itens: {
              create: itens.map((i) => ({
                produtoId: i.produtoId,
                varianteId: i.varianteId ?? null,
                quantidade: i.quantidade,
                precoUnitario: i.precoUnitario,
              })),
            },
          },
          include: { itens: true },
        });
        await tx.pagamento.create({
          data: {
            lojaId: loja.id,
            pedidoId: p.id,
            metodo: "MULTICAIXA",
            status: "PENDENTE",
            valor: total,
            moeda: moedaLoja,
            provedor: "multicaixa",
            comprovanteUrl: comprovanteUrl ?? null,
          },
        });
        await reservarStock(tx, loja.id, p.id, itensReserva);
        return p;
      }, { isolationLevel: "Serializable" });
    } catch (err) {
      if (String(err).includes("STOCK_INSUFICIENTE")) {
        return NextResponse.json({ erro: "Um ou mais produtos não têm stock disponível." }, { status: 409 });
      }
      throw err;
    }

    const emailLojista = loja.utilizadores[0]?.email ?? undefined;
    void enviarEmailConfirmacaoPedido({
      nomeLoja: loja.nome,
      clienteNome,
      clienteEmail,
      pedidoId: pedido.id,
      itens: itens.map((i) => ({ titulo: i.titulo, quantidade: i.quantidade, precoUnitario: i.precoUnitario })),
      total,
      moeda: moedaLoja,
      emailLojista,
    });

    return NextResponse.json({
      modo: "multicaixa",
      pedidoId: pedido.id,
      redirectUrl: `/loja/${subdominio}/pedido/${pedido.id}/sucesso`,
    });
  }

  // --------------------------------------------------------------------------
  // AOA não é suportado pelo Stripe
  // --------------------------------------------------------------------------
  if (moedaLoja === "AOA") {
    return NextResponse.json({ erro: "Lojas AOA só aceitam pagamento Multicaixa" }, { status: 400 });
  }

  // --------------------------------------------------------------------------
  // Stripe — criar pedido + pagamento PENDENTE, depois redirigir para Stripe
  // --------------------------------------------------------------------------
  const paymentMethods = METODO_STRIPE_MAP[metodoPagamento] ?? ["card"];

  let pedido;
  try {
    pedido = await prisma.$transaction(async (tx) => {
      const p = await tx.pedido.create({
        data: {
          lojaId: loja.id,
          clienteEmail,
          clienteNome,
          morada: { ...morada, clienteTelefone: clienteTelefone ?? null },
          subtotal: total,
          desconto: 0,
          total,
          status: "PENDING",
          channel: "ONLINE",
          clientUuid,
          itens: {
            create: itens.map((i) => ({
              produtoId: i.produtoId,
              varianteId: i.varianteId ?? null,
              quantidade: i.quantidade,
              precoUnitario: i.precoUnitario,
            })),
          },
        },
      });
      // Cria pagamento PENDENTE — referência Stripe será adicionada abaixo
      await tx.pagamento.create({
        data: {
          lojaId: loja.id,
          pedidoId: p.id,
          metodo: metodoPagamentoEnum,
          status: "PENDENTE",
          valor: total,
          moeda: moedaLoja,
          provedor: "stripe",
        },
      });
      await reservarStock(tx, loja.id, p.id, itensReserva);
      return p;
    }, { isolationLevel: "Serializable" });
  } catch (err) {
    if (String(err).includes("STOCK_INSUFICIENTE")) {
      return NextResponse.json({ erro: "Um ou mais produtos não têm stock disponível." }, { status: 409 });
    }
    throw err;
  }

  // Criar sessão Stripe
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    currency: moedaStripe,
    customer_email: clienteEmail,
    phone_number_collection: { enabled: metodoPagamento === "mbway" },
    line_items: itens.map((i) => ({
      price_data: {
        currency: moedaStripe,
        unit_amount: Math.round(i.precoUnitario * 100),
        product_data: {
          name: i.titulo,
          ...(i.imagemUrl ? { images: [i.imagemUrl] } : {}),
        },
      },
      quantity: i.quantidade,
    })),
    payment_method_types: paymentMethods,
    success_url: `${origin}/loja/${subdominio}/pedido/${pedido.id}/sucesso`,
    cancel_url: `${origin}/loja/${subdominio}?checkout=cancelado`,
    metadata: {
      pedidoId: pedido.id,
      lojaId: loja.id,
      subdominio,
      clienteNome,
      clientUuid,
    },
  });

  // Guardar Stripe session ID no Pagamento (referência para o webhook)
  await prisma.pagamento.updateMany({
    where: { pedidoId: pedido.id, provedor: "stripe", status: "PENDENTE" },
    data: { referencia: session.id },
  });

  return NextResponse.json({ redirectUrl: session.url });
}
