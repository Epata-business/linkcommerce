"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { enviarEmailPedidoEnviado } from "@/lib/email";
import { libertarReserva } from "@/lib/inventario";

async function getLojaIdDoUtilizadorAtual() {
  const session = await auth();
  if (!session?.user?.lojaId) throw new Error("Sem loja associada.");
  return session.user.lojaId as string;
}

const StatusSchema = z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]);

export async function atualizarStatusPedido(pedidoId: string, status: string, tracking?: string) {
  const lojaId = await getLojaIdDoUtilizadorAtual();
  const statusParsed = StatusSchema.parse(status);

  const pedidoAtual = await prisma.pedido.findFirst({
    where: { id: pedidoId, lojaId },
    select: {
      status: true,
      morada: true,
      itens: { select: { produtoId: true, varianteId: true, quantidade: true } },
    },
  });
  if (!pedidoAtual) throw new Error("Pedido não encontrado.");

  const moradaAtual = (pedidoAtual.morada as Record<string, unknown>) ?? {};
  const moradaAtualizada = tracking !== undefined
    ? { ...moradaAtual, tracking }
    : moradaAtual;

  const statusAnterior = pedidoAtual.status;
  const itensReserva = pedidoAtual.itens.map((i) => ({
    produtoId: i.produtoId,
    varianteId: i.varianteId ?? null,
    quantidade: i.quantidade,
  }));

  await prisma.$transaction(async (tx) => {
    await tx.pedido.updateMany({
      where: { id: pedidoId, lojaId },
      data: {
        status: statusParsed,
        morada: moradaAtualizada as Record<string, string>,
        ...(statusParsed === "SHIPPED" ? { sincronizadoEm: new Date() } : {}),
      },
    });

    // Ao cancelar um pedido PENDING → libertar a reserva de stock
    if (statusParsed === "CANCELLED" && statusAnterior === "PENDING") {
      await libertarReserva(tx, lojaId, pedidoId, itensReserva, "CANCELAMENTO", "Cancelado manualmente pelo lojista");
    }
  });

  // Notificar cliente por email quando pedido é enviado
  if (statusParsed === "SHIPPED") {
    const pedidoCompleto = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { loja: { select: { nome: true } } },
    });
    if (pedidoCompleto) {
      await enviarEmailPedidoEnviado({
        nomeLoja: pedidoCompleto.loja.nome,
        clienteNome: pedidoCompleto.clienteNome ?? "Cliente",
        clienteEmail: pedidoCompleto.clienteEmail,
        pedidoId: pedidoCompleto.id,
        tracking: tracking || undefined,
      }).catch(() => {});
    }
  }

  revalidatePath("/dashboard/pedidos");
  revalidatePath(`/dashboard/pedidos/${pedidoId}`);
}
