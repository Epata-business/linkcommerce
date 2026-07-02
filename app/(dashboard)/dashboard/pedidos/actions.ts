"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { enviarEmailPedidoEnviado } from "@/lib/email";

async function getLojaIdDoUtilizadorAtual() {
  const session = await auth();
  if (!session?.user?.lojaId) throw new Error("Sem loja associada.");
  return session.user.lojaId as string;
}

const StatusSchema = z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]);

export async function atualizarStatusPedido(pedidoId: string, status: string, tracking?: string) {
  const lojaId = await getLojaIdDoUtilizadorAtual();
  const statusParsed = StatusSchema.parse(status);

  const pedidoAtual = await prisma.pedido.findFirst({
    where: { id: pedidoId, lojaId },
    select: { morada: true },
  });
  if (!pedidoAtual) throw new Error("Pedido não encontrado.");

  // Merge tracking no campo morada (Json)
  const moradaAtual = (pedidoAtual.morada as Record<string, unknown>) ?? {};
  const moradaAtualizada = tracking !== undefined
    ? { ...moradaAtual, tracking }
    : moradaAtual;

  await prisma.pedido.updateMany({
    where: { id: pedidoId, lojaId },
    data: {
      status: statusParsed,
      morada: moradaAtualizada as Record<string, string>,
      ...(statusParsed === "SHIPPED" ? { sincronizadoEm: new Date() } : {}),
    },
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
      }).catch(() => {}); // silenciar erro se Resend falhar
    }
  }

  revalidatePath("/dashboard/pedidos");
  revalidatePath(`/dashboard/pedidos/${pedidoId}`);
}
