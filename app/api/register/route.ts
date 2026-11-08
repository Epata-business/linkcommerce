import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limiting: 5 registos por IP a cada 15 minutos
  const limited = checkRateLimit(request, { prefix: "register", limit: 5, windowSec: 900 });
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const nome = typeof body.nome === "string" ? body.nome.trim().slice(0, 100) : "";
  const email = typeof body.email === "string" ? body.email.toLowerCase().trim().slice(0, 254) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!nome || !email || !password || password.length < 8 || password.length > 128) {
    return NextResponse.json({ erro: "dados-invalidos" }, { status: 400 });
  }

  // Validação básica de formato de email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
