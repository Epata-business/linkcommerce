import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarAssinaturaZernio } from "@/lib/zernio";

// Zernio webhook handler
// Configure in Zernio dashboard: POST https://app.linkcommerce.cc/api/webhook/zernio
// Events: post.published, post.failed
// Env var: ZERNIO_WEBHOOK_SECRET (the secret you set when creating the webhook)

export async function POST(req: NextRequest) {
  const body = await req.text();

  const signature = req.headers.get("X-Zernio-Signature") ?? "";
  if (process.env.ZERNIO_WEBHOOK_SECRET && !verificarAssinaturaZernio(body, signature)) {
    return NextResponse.json({ erro: "Assinatura inválida" }, { status: 401 });
  }

  let event: { id: string; type: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 });
  }

  // Deduplicate by event ID (at-least-once delivery)
  const eventId = event.id;
  const postId = event.data?.postId as string | undefined;

  switch (event.type) {
    case "post.published": {
      if (postId) {
        await prisma.publicacaoSocial.updateMany({
          where: { zernioPostId: postId },
          data: { estado: "publicado", publicadoEm: new Date() },
        });
      }
      break;
    }

    case "post.failed": {
      if (postId) {
        const erroMsg = (event.data?.error as string | undefined) ?? "Falha desconhecida";
        await prisma.publicacaoSocial.updateMany({
          where: { zernioPostId: postId },
          data: { estado: "falhado", erroMsg: erroMsg.slice(0, 500) },
        });
      }
      break;
    }

    default:
      break;
  }

  void eventId; // used for future deduplication tracking
  return NextResponse.json({ recebido: true });
}
