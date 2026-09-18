import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const lojaId = (session?.user as { lojaId?: string })?.lojaId;
  if (!lojaId) return NextResponse.json({ ativa: false });

  const sub = await prisma.subscricao.findUnique({
    where: { lojaId },
    select: { status: true },
  });

  return NextResponse.json({ ativa: sub?.status === "ATIVA" });
}
