import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { auth } from "@/lib/auth";
import { ROLES_ATRIBUIVEIS, podeGerir } from "@/lib/rbac";

// GET — listar membros da equipa
export async function GET() {
  const lojaId = await getLojaId();
  const membros = await prisma.user.findMany({
    where: { lojaId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ membros });
}

// POST — adicionar membro por email (o utilizador já tem de ter conta)
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!podeGerir(role)) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const lojaId = await getLojaId();
  const { email, novoRole } = await req.json();

  if (!email || !novoRole) {
    return NextResponse.json({ erro: "Email e role são obrigatórios" }, { status: 400 });
  }
  if (!ROLES_ATRIBUIVEIS.includes(novoRole)) {
    return NextResponse.json({ erro: "Role inválido" }, { status: 400 });
  }

  const utilizador = await prisma.user.findUnique({ where: { email } });
  if (!utilizador) {
    return NextResponse.json({ erro: "Utilizador não encontrado. O utilizador tem de ter uma conta." }, { status: 404 });
  }
  if (utilizador.lojaId && utilizador.lojaId !== lojaId) {
    return NextResponse.json({ erro: "Este utilizador pertence a outra loja." }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: utilizador.id },
    data: { lojaId, role: novoRole },
  });

  return NextResponse.json({ ok: true });
}
