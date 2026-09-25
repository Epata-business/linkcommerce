/**
 * lib/inventario.ts
 * Operações atómicas de stock — reserva, venda, cancelamento, expiração.
 * Usa SELECT FOR UPDATE para evitar race conditions (dois clientes, 1 unidade).
 * Todas as operações correm dentro de uma transacção Prisma.
 */

import { Prisma } from "@prisma/client";

export interface ItemReserva {
  produtoId: string;
  varianteId?: string | null;
  quantidade: number;
}

interface TxClient {
  $queryRaw: typeof Prisma.raw extends never ? never : (...args: never[]) => never;
  produto: { update: Function; findUnique: Function };
  variante: { update: Function; findUnique: Function };
  movimentoStock: { createMany: Function };
}

/**
 * Reserva stock para os itens de um pedido.
 * Lança erro se algum item não tiver stock suficiente.
 * Deve ser chamada dentro de prisma.$transaction.
 */
export async function reservarStock(
  tx: Prisma.TransactionClient,
  lojaId: string,
  pedidoId: string,
  itens: ItemReserva[],
) {
  for (const item of itens) {
    if (item.varianteId) {
      // Bloqueia a linha da variante (SELECT FOR UPDATE)
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
      // Bloqueia a linha do produto (SELECT FOR UPDATE)
      const rows = await tx.$queryRaw<{ id: string; stock: number; stockReservado: number; "permitirOverselling": boolean }[]>`
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
  }

  // Regista movimentos de reserva em batch
  await tx.movimentoStock.createMany({
    data: itens.map((item) => ({
      lojaId,
      produtoId: item.produtoId,
      varianteId: item.varianteId ?? null,
      tipo: "RESERVA" as const,
      quantidade: item.quantidade,
      pedidoId,
      nota: "Reserva automática no checkout",
    })),
  });
}

/**
 * Converte reserva em venda: decrementa stock físico e liberta stockReservado.
 * Chamada quando o pagamento é confirmado.
 */
export async function confirmarVenda(
  tx: Prisma.TransactionClient,
  lojaId: string,
  pedidoId: string,
  itens: ItemReserva[],
) {
  for (const item of itens) {
    if (item.varianteId) {
      await tx.variante.update({
        where: { id: item.varianteId },
        data: {
          stock: { decrement: item.quantidade },
          stockReservado: { decrement: item.quantidade },
        },
      });
    } else {
      await tx.produto.update({
        where: { id: item.produtoId },
        data: {
          stock: { decrement: item.quantidade },
          stockReservado: { decrement: item.quantidade },
        },
      });
    }
  }

  await tx.movimentoStock.createMany({
    data: itens.map((item) => ({
      lojaId,
      produtoId: item.produtoId,
      varianteId: item.varianteId ?? null,
      tipo: "VENDA" as const,
      quantidade: -item.quantidade,
      pedidoId,
      nota: "Venda confirmada por pagamento",
    })),
  });
}

/**
 * Liberta a reserva sem decrementar stock físico.
 * Chamada em: cancelamento manual, expiração, pagamento falhado.
 */
export async function libertarReserva(
  tx: Prisma.TransactionClient,
  lojaId: string,
  pedidoId: string,
  itens: ItemReserva[],
  tipo: "CANCELAMENTO" | "RESERVA_EXPIRADA" = "CANCELAMENTO",
  nota?: string,
) {
  for (const item of itens) {
    if (item.varianteId) {
      await tx.variante.update({
        where: { id: item.varianteId },
        data: { stockReservado: { decrement: item.quantidade } },
      });
    } else {
      await tx.produto.update({
        where: { id: item.produtoId },
        data: { stockReservado: { decrement: item.quantidade } },
      });
    }
  }

  await tx.movimentoStock.createMany({
    data: itens.map((item) => ({
      lojaId,
      produtoId: item.produtoId,
      varianteId: item.varianteId ?? null,
      tipo,
      quantidade: item.quantidade,
      pedidoId,
      nota: nota ?? (tipo === "RESERVA_EXPIRADA" ? "Reserva expirada automaticamente" : "Reserva libertada por cancelamento"),
    })),
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
