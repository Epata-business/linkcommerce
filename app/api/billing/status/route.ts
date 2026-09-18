import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  let lojaId = (session?.user as { lojaId?: string })?.lojaId ?? null;
  if (!lojaId && session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { lojaId: true },
    });
    lojaId = dbUser?.lojaId ?? null;
  }
  if (!lojaId) return NextResponse.json({ ativa: false });

  const sub = await prisma.subscricao.findUnique({
    where: { lojaId },
    select: { status: true },
  });

  return NextResponse.json({ ativa: sub?.status === "ATIVA" });
}
