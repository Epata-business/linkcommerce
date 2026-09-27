import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { enviarEmailConfirmacaoPedido } from "@/lib/email";
import { reservarStock, type ItemReserva } from "@/lib/inventario";
import { criarNotificacao } from "@/lib/notificacoes";
import { notificarNovoPedidoLojista } from "@/lib/whatsapp";
import { criarFatura } from "@/lib/faturas";
import { enviarPushParaLoja } from "@/lib/push";
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
  codigoCupao: z.string().optional(),
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
    morada, metodoPagamento, comprovanteUrl, zonaEntregaId, codigoCupao,
  } = parsed.data;

  const loja = await prisma.loja.findUnique({
    where: { subdominio, publicada: true },
    include: { utilizadores: { where: { role: "LOJISTA" }, select: { email: true }, take: 1 } },
    // waToken and waPhoneId come via the default loja fields
  });
  if (!loja) return NextResponse.json({ erro: "Loja não encontrada" }, { status: 404 });

  const moedaLoja = loja.moeda ?? "AOA";
  const moedaStripe = moedaLoja.toLowerCase();
  const clientUuid = randomUUID();
  const subtotalCalc = itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);

  // Validar cupão (se fornecido)
  let cupaoId: string | null = null;
  let descontoValor = 0;
  if (codigoCupao) {
    const cupao = await prisma.cupao.findUnique({
      where: { lojaId_codigo: { lojaId: loja.id, codigo: codigoCupao.toUpperCase() } },
    });
    if (cupao && cupao.ativo && (!cupao.validade || cupao.validade >= new Date()) &&
        (cupao.usosMaximos === null || cupao.usosAtuais < cupao.usosMaximos)) {
      cupaoId = cupao.id;
      descontoValor = cupao.tipo === "PERCENTAGEM"
        ? Math.round((subtotalCalc * Number(cupao.valor) / 100) * 100) / 100
        : Math.min(Number(cupao.valor), subtotalCalc);
    }
  }
  const total = Math.max(0, Math.round((subtotalCalc - descontoValor) * 100) / 100);
  const origin = req.nextUrl.origin;
  const metodoPagamentoEnum = METODO_MAP[metodoPagamento] ?? "DESCONHECIDO";

  const itensReserva = itens.map((i) => ({
    produtoId: i.produtoId,
    varianteId: i.varianteId ?? null,
    quantidade: i.quantidade,
  }));

  // Registar carrinho abandonado — marcado CONVERTIDO quando pedido for criado com sucesso
  const carrinhoItens = itens.map((i) => ({
    produtoId: i.produtoId,
    titulo: i.titulo,
    precoUnitario: i.precoUnitario,
    quantidade: i.quantidade,
    imagemUrl: i.imagemUrl ?? null,
  }));
  const carrinhoAbandonado = await prisma.carrinhoAbandonado.create({
    data: {
      lojaId: loja.id,
      clienteEmail,
      clienteNome,
      itens: carrinhoItens,
      total,
      moeda: moedaLoja,
    },
  });

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
            subtotal: subtotalCalc,
            desconto: descontoValor,
            total,
            status: "PENDING",
            channel: "ONLINE",
            clientUuid,
            cupaoId,
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
            status: "CONFIRMADO",
            valor: total,
            moeda: moedaLoja,
            provedor: "manual",
          },
        });
        if (cupaoId) await tx.cupao.update({ where: { id: cupaoId }, data: { usosAtuais: { increment: 1 } } });
        await reservarStock(tx, loja.id, p.id, itensReserva, "directo");
        return p;
      }, { isolationLevel: "Serializable" });
    } catch (err) {
      if (String(err).includes("STOCK_INSUFICIENTE")) {
        return NextResponse.json({ erro: "Um ou mais produtos não têm stock disponível." }, { status: 409 });
      }
      throw err;
    }
    void criarNotificacao({
      lojaId: loja.id,
      tipo: "novo_pedido",
      titulo: "Novo pedido",
      mensagem: `Pedido #${pedido.id.slice(-8).toUpperCase()} de ${clienteNome} — ${total.toFixed(2)} ${moedaLoja}.`,
      link: `/dashboard/pedidos/${pedido.id}`,
      pedidoId: pedido.id,
    });
    if (loja.telefoneWA) void notificarNovoPedidoLojista({ telefoneWA: loja.telefoneWA, nomeLoja: loja.nome, clienteNome, pedidoId: pedido.id, total, moeda: moedaLoja, loja });
    void criarFatura({ lojaId: loja.id, pedidoId: pedido.id, subtotal: subtotalCalc, desconto: descontoValor, total, moeda: moedaLoja, taxaIva: moedaLoja === "AOA" ? 14 : 23, clienteNome, clienteEmail, lojaNome: loja.nome, lojaNif: loja.nif, lojaMorada: loja.moradaFiscal });
    void enviarPushParaLoja(loja.id, { title: `🛒 Novo pedido — ${loja.nome}`, body: `${clienteNome} · ${total.toFixed(2)} ${moedaLoja}`, url: `/dashboard/pedidos/${pedido.id}` });
    void prisma.carrinhoAbandonado.update({ where: { id: carrinhoAbandonado.id }, data: { status: "CONVERTIDO" } });
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
            subtotal: subtotalCalc,
            desconto: descontoValor,
            total,
            status: "PENDING",
            channel: "ONLINE",
            clientUuid,
            cupaoId,
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
        if (cupaoId) await tx.cupao.update({ where: { id: cupaoId }, data: { usosAtuais: { increment: 1 } } });
        await reservarStock(tx, loja.id, p.id, itensReserva, "multicaixa");
        return p;
      }, { isolationLevel: "Serializable" });
    } catch (err) {
      if (String(err).includes("STOCK_INSUFICIENTE")) {
        return NextResponse.json({ erro: "Um ou mais produtos não têm stock disponível." }, { status: 409 });
      }
      throw err;
    }

    void criarNotificacao({
      lojaId: loja.id,
      tipo: "novo_pedido",
      titulo: "Novo pedido — Multicaixa",
      mensagem: `Pedido #${pedido.id.slice(-8).toUpperCase()} de ${clienteNome} aguarda comprovativo Multicaixa.`,
      link: `/dashboard/pedidos/${pedido.id}`,
      pedidoId: pedido.id,
    });
    if (loja.telefoneWA) void notificarNovoPedidoLojista({ telefoneWA: loja.telefoneWA, nomeLoja: loja.nome, clienteNome, pedidoId: pedido.id, total, moeda: moedaLoja, loja });
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

    void enviarPushParaLoja(loja.id, { title: `💳 Multicaixa pendente — ${loja.nome}`, body: `${clienteNome} · ${total.toFixed(2)} ${moedaLoja} — aguarda comprovativo`, url: `/dashboard/pedidos/${pedido.id}` });
    void prisma.carrinhoAbandonado.update({ where: { id: carrinhoAbandonado.id }, data: { status: "CONVERTIDO" } });
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
          subtotal: subtotalCalc,
          desconto: descontoValor,
          total,
          status: "PENDING",
          channel: "ONLINE",
          clientUuid,
          cupaoId,
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
      if (cupaoId) await tx.cupao.update({ where: { id: cupaoId }, data: { usosAtuais: { increment: 1 } } });
      await reservarStock(tx, loja.id, p.id, itensReserva, "stripe");
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
      carrinhoId: carrinhoAbandonado.id,
    },
  });

  // Guardar Stripe session ID no Pagamento (referência para o webhook)
  await prisma.pagamento.updateMany({
    where: { pedidoId: pedido.id, provedor: "stripe", status: "PENDENTE" },
    data: { referencia: session.id },
  });

  return NextResponse.json({ redirectUrl: session.url });
}
