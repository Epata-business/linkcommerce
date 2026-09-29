import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ROLES_ATRIBUIVEIS } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  const { token, email, lojaId, role, nome, senha } = await req.json().catch(() => ({}));

  if (!token || !email || !lojaId || !role || !nome || !senha || senha.length < 8) {
    return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });
  }
  if (!ROLES_ATRIBUIVEIS.includes(role)) {
    return NextResponse.json({ erro: "Função inválida" }, { status: 400 });
  }

  const emailNorm = (email as string).toLowerCase().trim();
  const identifier = `invite:${lojaId}:${role}:${emailNorm}`;

  const registo = await prisma.verificationToken.findFirst({
    where: { identifier, token, expires: { gt: new Date() } },
  });
  if (!registo) {
    return NextResponse.json({ erro: "Convite inválido ou expirado." }, { status: 400 });
  }

  // Verificar que a loja existe
  const loja = await prisma.loja.findUnique({ where: { id: lojaId }, select: { id: true } });
  if (!loja) return NextResponse.json({ erro: "Loja não encontrada." }, { status: 404 });

  // Utilizador pode já ter conta (criou entretanto)
  const existente = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (existente) {
    if (existente.lojaId && existente.lojaId !== lojaId) {
      return NextResponse.json({ erro: "Esta conta já pertence a outra loja." }, { status: 409 });
    }
    await prisma.user.update({
      where: { id: existente.id },
      data: { lojaId, role },
    });
  } else {
    const hash = await bcrypt.hash(senha as string, 12);
    await prisma.user.create({
      data: { name: nome as string, email: emailNorm, passwordHash: hash, role, lojaId },
    });
  }

  await prisma.verificationToken.deleteMany({ where: { identifier } });

  return NextResponse.json({ ok: true });
}
