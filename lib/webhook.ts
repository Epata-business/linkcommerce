import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

export type EventoWebhook =
  | "pedido.criado"
  | "pedido.pago"
  | "pedido.enviado"
  | "pedido.entregue"
  | "pedido.cancelado"
  | "pagamento.confirmado";

export async function dispararWebhooks(
  lojaId: string,
  evento: EventoWebhook,
  payload: Record<string, unknown>
) {
  const hooks = await prisma.webhook.findMany({
    where: { lojaId, ativo: true, eventos: { has: evento } },
    select: { url: true, secret: true },
  });
  if (hooks.length === 0) return;

  const body = JSON.stringify({ evento, timestamp: new Date().toISOString(), dados: payload });

  void Promise.allSettled(
    hooks.map(h => {
      const assinatura = createHmac("sha256", h.secret).update(body).digest("hex");
      return fetch(h.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-LinkCommerce-Signature": `sha256=${assinatura}`,
          "X-LinkCommerce-Event": evento,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      }).catch(() => null);
    })
  );
}
