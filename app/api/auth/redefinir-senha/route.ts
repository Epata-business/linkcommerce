import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { email, token, novaSenha } = await req.json().catch(() => ({}));

  if (!email || !token || !novaSenha || novaSenha.length < 6) {
    return NextResponse.json({ erro: "dados-invalidos" }, { status: 400 });
  }

  const emailNorm = (email as string).toLowerCase().trim();

  const registo = await prisma.verificationToken.findFirst({
    where: { identifier: emailNorm, token, expires: { gt: new Date() } },
  });

  if (!registo) {
    return NextResponse.json({ erro: "token-invalido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: emailNorm },
    select: { id: true, passwordHash: true },
  });

  // Apenas permite redefinição para contas com password (não OAuth-only)
  if (!user || !user.passwordHash) {
    return NextResponse.json({ erro: "token-invalido" }, { status: 400 });
  }

  const hash = await bcrypt.hash(novaSenha as string, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { email: emailNorm }, data: { passwordHash: hash } }),
    prisma.verificationToken.deleteMany({ where: { identifier: emailNorm } }),
  ]);

  return NextResponse.json({ ok: true });
}
