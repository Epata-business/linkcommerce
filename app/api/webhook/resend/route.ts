import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

// Resend webhook handler — delivery, bounce, complaint, open, click events
// Configure webhook URL in Resend dashboard: https://resend.com/webhooks
// Events to subscribe: email.delivered, email.bounced, email.complained, email.opened, email.clicked
// Env var: RESEND_WEBHOOK_SECRET (signing secret from dashboard)

export async function POST(req: NextRequest) {
  const body = await req.text();
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  if (secret) {
    const svixId = req.headers.get("svix-id") ?? "";
    const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
    const svixSignature = req.headers.get("svix-signature") ?? "";

    // Resend uses Svix for webhook signature verification
    const toSign = `${svixId}.${svixTimestamp}.${body}`;
    const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
    const computed = createHmac("sha256", secretBytes).update(toSign).digest("base64");
    const expectedSig = `v1,${computed}`;

    const isValid = svixSignature.split(" ").some((sig) => sig === expectedSig);
    if (!isValid) {
      return NextResponse.json({ erro: "Assinatura inválida" }, { status: 401 });
    }

    // Reject replays older than 5 minutes
    const ts = parseInt(svixTimestamp, 10);
    if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
      return NextResponse.json({ erro: "Timestamp inválido" }, { status: 401 });
    }
  }

  let event: { type: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 });
  }

  // Log events for observability — extend here to handle bounces/complaints
  switch (event.type) {
    case "email.bounced":
      console.error("[resend] bounce:", event.data.to, event.data.bounce_type);
      break;
    case "email.complained":
      console.error("[resend] complaint:", event.data.to);
      break;
    case "email.delivered":
    case "email.opened":
    case "email.clicked":
      break;
    default:
      console.log("[resend] event:", event.type);
  }

  return NextResponse.json({ recebido: true });
}
