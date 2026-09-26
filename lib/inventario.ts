/**
 * lib/inventario.ts
 * Operações atómicas de stock — reserva, venda, cancelamento, expiração.
 * Usa SELECT FOR UPDATE para evitar race conditions (dois clientes, 1 unidade).
 * Todas as operações correm dentro de uma transacção Prisma.
 *
 * P18: adicionada tabela StockReserva para idempotência por pedidoId,
 * expiração automática via cron e libertação correcta baseada em registos reais.
 */

import { Prisma } from "@prisma/client";

export interface ItemReserva {
  produtoId: string;
  varianteId?: string | null;
  quantidade: number;
}

// TTL por canal de pagamento
const TTL_STRIPE_MS    = 30 * 60 * 1000;       // 30 min
const TTL_MULTICAIXA_MS = 48 * 60 * 60 * 1000; // 48 h
const TTL_POS_MS       = 5 * 60 * 1000;         // 5 min (POS confirma imediatamente)

export function ttlParaCanal(canal: "stripe" | "multicaixa" | "pos" | "directo"): Date {
  const ms =
    canal === "multicaixa" ? TTL_MULTICAIXA_MS :
    canal === "pos"        ? TTL_POS_MS        :
    TTL_STRIPE_MS;
  return new Date(Date.now() + ms);
}

/**
 * Reserva stock para os itens de um pedido.
 * - Idempotente: se já existe StockReserva ACTIVA para este pedidoId, retorna sem erro.
 * - Lança erro se algum item não tiver stock suficiente.
 * - Deve ser chamada dentro de prisma.$transaction.
 */
export async function reservarStock(
  tx: Prisma.TransactionClient,
  lojaId: string,
  pedidoId: string,
  itens: ItemReserva[],
  canal: "stripe" | "multicaixa" | "pos" | "directo" = "stripe",
) {
  // Idempotência: verificar se já existe reserva activa para este pedido
  const reservaExistente = await tx.stockReserva.findFirst({
    where: { pedidoId, lojaId, status: "ACTIVA" },
    select: { id: true },
  });
  if (reservaExistente) return; // já reservado — idempotente

  const expiresAt = ttlParaCanal(canal);

  for (const item of itens) {
    if (item.varianteId) {
      const rows = await tx.$queryRaw<{ id: string; stock: number; stockReservado: number }[]>`
        SELECT id, stock, "stockReservado"
        FROM variantes
        WHERE id = ${item.varianteId}
        FOR UPDATE
      `;
      const variante = rows[0];
      if (!variante) throw new Error(`VARIANTE_NAO_ENCONTRADA:${item.varianteId}`);

      const disponivel = variante.stock - variante.stockReservado;
      if (disponivel < item.quantidade) {
        throw new Error(`STOCK_INSUFICIENTE:${item.produtoId}:${item.varianteId}`);
      }

      await tx.variante.update({
        where: { id: item.varianteId },
        data: { stockReservado: { increment: item.quantidade } },
      });
    } else {
      const rows = await tx.$queryRaw<{ id: string; stock: number; stockReservado: number; permitirOverselling: boolean }[]>`
        SELECT id, stock, "stockReservado", "permitirOverselling"
        FROM produtos
        WHERE id = ${item.produtoId} AND "lojaId" = ${lojaId}
        FOR UPDATE
      `;
      const produto = rows[0];
      if (!produto) throw new Error(`PRODUTO_NAO_ENCONTRADO:${item.produtoId}`);

      if (!produto.permitirOverselling) {
        const disponivel = produto.stock - produto.stockReservado;
        if (disponivel < item.quantidade) {
          throw new Error(`STOCK_INSUFICIENTE:${item.produtoId}`);
        }
      }

      await tx.produto.update({
        where: { id: item.produtoId },
        data: { stockReservado: { increment: item.quantidade } },
      });
    }

    // Criar registo de reserva individual
    const reserva = await tx.stockReserva.create({
      data: {
        lojaId,
        pedidoId,
        produtoId: item.produtoId,
        varianteId: item.varianteId ?? null,
        quantidade: item.quantidade,
        status: "ACTIVA",
        expiresAt,
      },
    });

    await tx.movimentoStock.create({
      data: {
        lojaId,
        produtoId: item.produtoId,
        varianteId: item.varianteId ?? null,
        tipo: "RESERVA",
        quantidade: item.quantidade,
        pedidoId,
        reservaId: reserva.id,
        nota: "Reserva automática no checkout",
      },
    });
  }
}

/**
 * Converte reservas activas em vendas: decrementa stock físico e liberta stockReservado.
 * Chamada quando o pagamento é confirmado.
 * Idempotente: ignora itens cujas reservas já foram convertidas.
 */
export async function confirmarVenda(
  tx: Prisma.TransactionClient,
  lojaId: string,
  pedidoId: string,
  itens: ItemReserva[],
) {
  // Carregar reservas activas deste pedido (fonte de verdade)
  const reservas = await tx.stockReserva.findMany({
    where: { pedidoId, lojaId, status: "ACTIVA" },
  });

  if (reservas.length === 0) return; // já convertidas ou sem reserva (POS)

  for (const reserva of reservas) {
    if (reserva.varianteId) {
      await tx.variante.update({
        where: { id: reserva.varianteId },
        data: {
          stock: { decrement: reserva.quantidade },
          stockReservado: { decrement: reserva.quantidade },
        },
      });
    } else {
      await tx.produto.update({
        where: { id: reserva.produtoId },
        data: {
          stock: { decrement: reserva.quantidade },
          stockReservado: { decrement: reserva.quantidade },
        },
      });
    }

    await tx.stockReserva.update({
      where: { id: reserva.id },
      data: { status: "CONVERTIDA", resolvidaEm: new Date() },
    });

    await tx.movimentoStock.create({
      data: {
        lojaId,
        produtoId: reserva.produtoId,
        varianteId: reserva.varianteId ?? null,
        tipo: "VENDA",
        quantidade: -reserva.quantidade,
        pedidoId,
        reservaId: reserva.id,
        nota: "Venda confirmada por pagamento",
      },
    });
  }
}

/**
 * Liberta reservas activas sem decrementar stock físico.
 * Chamada em: cancelamento manual, pagamento falhado.
 * Carrega os itens da StockReserva — não depende de parâmetros externos.
 */
export async function libertarReserva(
  tx: Prisma.TransactionClient,
  lojaId: string,
  pedidoId: string,
  _itens: ItemReserva[], // mantido para compatibilidade de API — ignorado; usamos reservas reais
  tipo: "CANCELAMENTO" | "RESERVA_EXPIRADA" = "CANCELAMENTO",
  nota?: string,
) {
  const reservas = await tx.stockReserva.findMany({
    where: { pedidoId, lojaId, status: "ACTIVA" },
  });

  if (reservas.length === 0) return;

  for (const reserva of reservas) {
    if (reserva.varianteId) {
      await tx.variante.update({
        where: { id: reserva.varianteId },
        data: { stockReservado: { decrement: reserva.quantidade } },
      });
    } else {
      await tx.produto.update({
        where: { id: reserva.produtoId },
        data: { stockReservado: { decrement: reserva.quantidade } },
      });
    }

    const novoStatus = tipo === "RESERVA_EXPIRADA" ? "EXPIRADA" : "LIBERADA";
    await tx.stockReserva.update({
      where: { id: reserva.id },
      data: { status: novoStatus, resolvidaEm: new Date() },
    });

    await tx.movimentoStock.create({
      data: {
        lojaId,
        produtoId: reserva.produtoId,
        varianteId: reserva.varianteId ?? null,
        tipo,
        quantidade: reserva.quantidade,
        pedidoId,
        reservaId: reserva.id,
        nota: nota ?? (tipo === "RESERVA_EXPIRADA" ? "Reserva expirada automaticamente" : "Reserva libertada por cancelamento"),
      },
    });
  }
}

/**
 * Ajuste manual de stock pelo lojista (positivo ou negativo).
 * Altera o stock físico directamente; não afecta stockReservado.
 */
export async function ajustarStock(
  tx: Prisma.TransactionClient,
  lojaId: string,
  produtoId: string,
  varianteId: string | null,
  delta: number,
  userId: string | undefined,
  nota: string,
) {
  if (delta === 0) return;
  const tipo = delta > 0 ? ("REPOSICAO" as const) : ("AJUSTE" as const);

  if (varianteId) {
    const rows = await tx.$queryRaw<{ stock: number }[]>`
      SELECT stock FROM variantes WHERE id = ${varianteId} FOR UPDATE
    `;
    const novoStock = (rows[0]?.stock ?? 0) + delta;
    if (novoStock < 0) throw new Error("STOCK_NEGATIVO");
    await tx.variante.update({
      where: { id: varianteId },
      data: { stock: { increment: delta } },
    });
  } else {
    const rows = await tx.$queryRaw<{ stock: number }[]>`
      SELECT stock FROM produtos WHERE id = ${produtoId} AND "lojaId" = ${lojaId} FOR UPDATE
    `;
    const novoStock = (rows[0]?.stock ?? 0) + delta;
    if (novoStock < 0) throw new Error("STOCK_NEGATIVO");
    await tx.produto.update({
      where: { id: produtoId },
      data: { stock: { increment: delta } },
    });
  }

  await tx.movimentoStock.create({
    data: {
      lojaId,
      produtoId,
      varianteId: varianteId ?? null,
      tipo,
      quantidade: delta,
      nota,
    },
  });
}

/**
 * Regista devolução: incrementa stock físico.
 */
export async function registarDevolucao(
  tx: Prisma.TransactionClient,
  lojaId: string,
  pedidoId: string,
  itens: ItemReserva[],
  nota?: string,
) {
  for (const item of itens) {
    if (item.varianteId) {
      await tx.variante.update({
        where: { id: item.varianteId },
        data: { stock: { increment: item.quantidade } },
      });
    } else {
      await tx.produto.update({
        where: { id: item.produtoId },
        data: { stock: { increment: item.quantidade } },
      });
    }
  }

  await tx.movimentoStock.createMany({
    data: itens.map((item) => ({
      lojaId,
      produtoId: item.produtoId,
      varianteId: item.varianteId ?? null,
      tipo: "DEVOLUCAO" as const,
      quantidade: item.quantidade,
      pedidoId,
      nota: nota ?? "Devolução registada",
    })),
  });
}
