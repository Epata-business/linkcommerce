import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const body = await request.json();
  const nome = body.nome;
  const email = (body.email as string)?.toLowerCase().trim();
  const password = body.password;

  if (!nome || !email || !password || password.length < 6) {
    return NextResponse.json({ erro: "dados-invalidos" }, { status: 400 });
  }

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    return NextResponse.json({ erro: "email-em-uso" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name: nome, email, passwordHash, role: "LOJISTA" },
  });

  return NextResponse.json({ ok: true });
}
