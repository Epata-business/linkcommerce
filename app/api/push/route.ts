import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — guardar subscrição push
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  const lojaId = (session.user as { lojaId?: string }).lojaId;
  if (!userId || !lojaId) return NextResponse.json({ erro: "Sem loja" }, { status: 400 });

  const body = await req.json();
  const { endpoint, keys } = body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ erro: "Subscrição inválida" }, { status: 400 });
  }

  await prisma.pushSubscricao.upsert({
    where: { userId_endpoint: { userId, endpoint } },
    update: { p256dh: keys.p256dh, auth: keys.auth },
    create: { lojaId, userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });

  return NextResponse.json({ ok: true });
}

// DELETE — remover subscrição push
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ erro: "Sem utilizador" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const { endpoint } = body;

  if (endpoint) {
    await prisma.pushSubscricao.deleteMany({ where: { userId, endpoint } });
  } else {
    await prisma.pushSubscricao.deleteMany({ where: { userId } });
  }

  return NextResponse.json({ ok: true });
}
