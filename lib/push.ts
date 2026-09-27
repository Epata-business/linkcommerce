import webpush from "web-push";
import { prisma } from "@/lib/prisma";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? "mailto:suporte@linkcommerce.cc",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? "",
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export async function enviarPushParaLoja(lojaId: string, payload: PushPayload) {
  if (!process.env.VAPID_PRIVATE_KEY) return;

  const subscricoes = await prisma.pushSubscricao.findMany({ where: { lojaId } });
  if (subscricoes.length === 0) return;

  const data = JSON.stringify(payload);
  const expirar: string[] = [];

  await Promise.allSettled(
    subscricoes.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          data,
        );
      } catch (err: unknown) {
        // 410 Gone = subscription expirou, remover
        if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
          expirar.push(sub.id);
        }
      }
    }),
  );

  if (expirar.length > 0) {
    await prisma.pushSubscricao.deleteMany({ where: { id: { in: expirar } } });
  }
}
