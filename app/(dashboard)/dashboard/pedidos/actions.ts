"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { enviarEmailPedidoEnviado, enviarEmailConfirmacaoPedido } from "@/lib/email";
import { libertarReserva, confirmarVenda } from "@/lib/inventario";
import { registarAudit } from "@/lib/audit";
import { notificarPedidoEnviadoCliente } from "@/lib/whatsapp";
import { criarNotificacao } from "@/lib/notificacoes";
import { criarFatura } from "@/lib/faturas";

async function getSessionInfo() {
  const session = await auth();
  if (!session?.user?.lojaId) throw new Error("Sem loja associada.");
  return {
    lojaId: session.user.lojaId as string,
    userId: (session.user as { id?: string }).id,
    userEmail: session.user.email ?? undefined,
  };
}

async function getLojaIdDoUtilizadorAtual() {
  const { lojaId } = await getSessionInfo();
  return lojaId;
}

const StatusSchema = z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]);

export async function atualizarStatusPedido(
  pedidoId: string,
  status: string,
  tracking?: string,
  transportadora?: string,
) {
  const { lojaId, userId, userEmail } = await getSessionInfo();
  const statusParsed = StatusSchema.parse(status);

  const pedidoAtual = await prisma.pedido.findFirst({
    where: { id: pedidoId, lojaId },
    select: {
      status: true,
      morada: true,
      codigoRastreio: true,
      transportadora: true,
      itens: { select: { produtoId: true, varianteId: true, quantidade: true } },
    },
  });
  if (!pedidoAtual) throw new Error("Pedido não encontrado.");

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
        ...(statusParsed === "SHIPPED" ? { sincronizadoEm: new Date() } : {}),
        ...(tracking !== undefined ? { codigoRastreio: tracking } : {}),
        ...(transportadora !== undefined ? { transportadora } : {}),
      },
    });

    // PENDING → PROCESSING: confirmar venda converte reservas activas
    if (statusParsed === "PROCESSING" && statusAnterior === "PENDING") {
      await confirmarVenda(tx, lojaId, pedidoId, itensReserva);
      // Marcar pagamento manual como confirmado (Multicaixa, etc.)
      await tx.pagamento.updateMany({
        where: { pedidoId, lojaId, status: "PENDENTE" },
        data: { status: "CONFIRMADO" },
      });
    }

    if (statusParsed === "CANCELLED" && (statusAnterior === "PENDING" || statusAnterior === "PROCESSING")) {
      await libertarReserva(tx, lojaId, pedidoId, itensReserva, "CANCELAMENTO", "Cancelado manualmente pelo lojista");
    }
  });

  if (statusParsed === "SHIPPED") {
    const pedidoCompleto = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { loja: { select: { nome: true, waToken: true, waPhoneId: true } } },
    });
    if (pedidoCompleto) {
      await enviarEmailPedidoEnviado({
        nomeLoja: pedidoCompleto.loja.nome,
        clienteNome: pedidoCompleto.clienteNome ?? "Cliente",
        clienteEmail: pedidoCompleto.clienteEmail,
        pedidoId: pedidoCompleto.id,
        tracking: tracking || undefined,
      }).catch(() => {});

      const morada = pedidoCompleto.morada as Record<string, unknown> | null;
      const telefoneCliente = morada?.clienteTelefone as string | undefined;
      if (telefoneCliente) {
        void notificarPedidoEnviadoCliente({
          telefoneCliente,
          nomeLoja: pedidoCompleto.loja.nome,
          clienteNome: pedidoCompleto.clienteNome ?? "Cliente",
          pedidoId: pedidoCompleto.id,
          tracking: tracking || undefined,
          loja: pedidoCompleto.loja,
        });
      }
    }
  }

  void registarAudit({
    lojaId,
    userId,
    userEmail,
    acao: "ATUALIZAR",
    entidade: "Pedido",
    entidadeId: pedidoId,
    valoresAntigos: { status: statusAnterior, codigoRastreio: pedidoAtual.codigoRastreio, transportadora: pedidoAtual.transportadora },
    valoresNovos: { status: statusParsed, ...(tracking !== undefined ? { codigoRastreio: tracking } : {}), ...(transportadora !== undefined ? { transportadora } : {}) },
  });

  // Fatura + email + notificação ao confirmar pagamento manualmente
  if (statusParsed === "PROCESSING" && statusAnterior === "PENDING") {
    const pedidoCompleto = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        itens: { include: { produto: { select: { titulo: true } } } },
        loja: { select: { nome: true, moeda: true, nif: true, moradaFiscal: true, utilizadores: { where: { role: "LOJISTA" }, select: { email: true }, take: 1 } } },
      },
    });
    if (pedidoCompleto) {
      const moedaLoja = pedidoCompleto.loja.moeda ?? "EUR";
      void criarFatura({
        lojaId,
        pedidoId,
        subtotal: Number(pedidoCompleto.subtotal),
        desconto: Number(pedidoCompleto.desconto ?? 0),
        total: Number(pedidoCompleto.total),
        moeda: moedaLoja,
        taxaIva: moedaLoja === "AOA" ? 14 : 23,
        clienteNome: pedidoCompleto.clienteNome ?? "Cliente",
        clienteEmail: pedidoCompleto.clienteEmail,
        lojaNome: pedidoCompleto.loja.nome,
        lojaNif: pedidoCompleto.loja.nif,
        lojaMorada: pedidoCompleto.loja.moradaFiscal,
      });
      void enviarEmailConfirmacaoPedido({
        nomeLoja: pedidoCompleto.loja.nome,
        clienteNome: pedidoCompleto.clienteNome ?? "Cliente",
        clienteEmail: pedidoCompleto.clienteEmail,
        pedidoId,
        itens: pedidoCompleto.itens.map(i => ({
          titulo: i.produto?.titulo ?? "Produto",
          quantidade: i.quantidade,
          precoUnitario: Number(i.precoUnitario),
        })),
        total: Number(pedidoCompleto.total),
        moeda: moedaLoja,
        emailLojista: pedidoCompleto.loja.utilizadores[0]?.email ?? undefined,
      });
      void criarNotificacao({
        lojaId,
        tipo: "pagamento_confirmado",
        titulo: "Pagamento confirmado",
        mensagem: `Pedido #${pedidoId.slice(-8).toUpperCase()} confirmado manualmente — ${Number(pedidoCompleto.total).toFixed(2)} ${moedaLoja}.`,
        link: `/dashboard/pedidos/${pedidoId}`,
        pedidoId,
      });
    }
  }

  revalidatePath("/dashboard/pedidos");
  revalidatePath(`/dashboard/pedidos/${pedidoId}`);
  revalidatePath("/dashboard/envios");
}
