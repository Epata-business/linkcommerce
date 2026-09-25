import { prisma } from "@/lib/prisma";

type TipoNotificacao =
  | "novo_pedido"
  | "pagamento_confirmado"
  | "pagamento_falhado"
  | "stock_baixo"
  | "stock_esgotado";

export async function criarNotificacao(params: {
  lojaId: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  link?: string;
  pedidoId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.notificacao.create({
      data: {
        lojaId: params.lojaId,
        tipo: params.tipo,
        titulo: params.titulo,
        mensagem: params.mensagem,
        link: params.link ?? null,
        pedidoId: params.pedidoId ?? null,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
      },
    });
  } catch {
    // Notificações são não-críticas — nunca interrompem o fluxo principal
  }
}
