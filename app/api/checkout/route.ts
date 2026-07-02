import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
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
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });

  const { subdominio, itens, clienteEmail, clienteNome, clienteTelefone, morada, metodoPagamento } = parsed.data;

  const loja = await prisma.loja.findUnique({
    where: { subdominio, publicada: true },
    include: { utilizadores: { where: { role: "LOJISTA" }, select: { email: true }, take: 1 } },
  });
  if (!loja) return NextResponse.json({ erro: "Loja não encontrada" }, { status: 404 });

  const moeda = (loja.moeda ?? "EUR").toLowerCase();
  const clientUuid = randomUUID();
  const total = itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
  const origin = req.nextUrl.origin;

  // Modo sem Stripe: criar pedido directo (útil em dev sem chaves Stripe)
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
    const pedido = await prisma.pedido.create({
      data: {
        lojaId: loja.id,
        clienteEmail,
        clienteNome,
        morada: { ...morada, metodoPagamento, clienteTelefone: clienteTelefone ?? null },
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

    return NextResponse.json({
      modo: "directo",
      pedidoId: pedido.id,
      redirectUrl: `/loja/${subdominio}/pedido/${pedido.id}/sucesso`,
    });
  }

  // Mapear método escolhido para tipo(s) Stripe
  // Multicaixa não tem suporte Stripe — tratado como directo abaixo
  type StripePaymentMethod = "card" | "paypal" | "mb_way" | "multibanco";

  const metodoStripeMap: Record<string, StripePaymentMethod[]> = {
    cartao:     ["card"],
    mbway:      ["mb_way"],
    multibanco: ["multibanco"],
    paypal:     ["paypal"],
  };

  // Multicaixa Express não tem integração Stripe — criar pedido pendente directamente
  if (metodoPagamento === "multicaixa") {
    const pedido = await prisma.pedido.create({
      data: {
        lojaId: loja.id,
        clienteEmail,
        clienteNome,
        morada: { ...morada, metodoPagamento, clienteTelefone: clienteTelefone ?? null },
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
    return NextResponse.json({
      modo: "multicaixa",
      pedidoId: pedido.id,
      redirectUrl: `/loja/${subdominio}/pedido/${pedido.id}/sucesso`,
    });
  }

  const paymentMethods = metodoStripeMap[metodoPagamento] ?? ["card"];

  // Guardar pedido na DB ANTES do Stripe — dados ficam sempre salvos
  const pedido = await prisma.pedido.create({
    data: {
      lojaId: loja.id,
      clienteEmail,
      clienteNome,
      morada: { ...morada, metodoPagamento, clienteTelefone: clienteTelefone ?? null },
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

  // Criar sessão Stripe com o pedidoId no metadata
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    currency: moeda,
    customer_email: clienteEmail,
    phone_number_collection: { enabled: metodoPagamento === "mbway" },
    line_items: itens.map((i) => ({
      price_data: {
        currency: moeda,
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

  return NextResponse.json({ redirectUrl: session.url });
}
