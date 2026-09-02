import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Padrões de bots/crawlers conhecidos — usados apenas para filtrar, nunca guardados
const BOT_UA = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|discordbot|telegrambot|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider|gptbot|claudebot|anthropic|crawler|spider|scraper|bot\b/i;

const TIPOS_VALIDOS = ["store_view", "cta_click"] as const;
type TipoEvento = (typeof TIPOS_VALIDOS)[number];

export async function POST(req: NextRequest) {
  // 1. Filtrar bots pelo User-Agent (lido mas nunca guardado)
  const ua = req.headers.get("user-agent") ?? "";
  if (BOT_UA.test(ua)) {
    return NextResponse.json(null, { status: 204 });
  }

  // 2. Validar body
  let tipo: TipoEvento;
  let lojaId: string | null = null;
  try {
    const body = await req.json();
    if (!TIPOS_VALIDOS.includes(body.tipo)) {
      return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
    }
    tipo = body.tipo as TipoEvento;
    // lojaId é opcional e nunca exposto — só para contagem agregada interna
    if (typeof body.lojaId === "string" && body.lojaId.length > 0) {
      lojaId = body.lojaId;
    }
  } catch {
    return NextResponse.json({ error: "body inválido" }, { status: 400 });
  }

  // 3. Registar evento — apenas tipo, lojaId agregado e data (sem hora)
  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0); // apenas a data, sem hora

  await prisma.eventoPlataforma.create({
    data: { tipo, lojaId, dia: hoje },
  });

  return NextResponse.json(null, { status: 204 });
}
