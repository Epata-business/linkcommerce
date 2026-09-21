import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const { tipo } = body;

  if (tipo === "perfil") {
    const { nome, image } = body;
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: nome || null,
        image: image || null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (tipo === "senha") {
    const { senhaAtual, novaSenha } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return NextResponse.json({ erro: "Esta conta usa login social — não tem senha definida." }, { status: 400 });
    }

    const valida = await bcrypt.compare(senhaAtual, user.passwordHash);
    if (!valida) return NextResponse.json({ erro: "Senha actual incorrecta." }, { status: 400 });

    if (novaSenha.length < 8) {
      return NextResponse.json({ erro: "A nova senha deve ter pelo menos 8 caracteres." }, { status: 400 });
    }

    const hash = await bcrypt.hash(novaSenha, 12);
    await prisma.user.update({
      where: { email: session.user.email },
      data: { passwordHash: hash },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ erro: "Tipo inválido" }, { status: 400 });
}
