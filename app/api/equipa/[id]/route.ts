import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { auth } from "@/lib/auth";
import { ROLES_ATRIBUIVEIS, podeGerir } from "@/lib/rbac";
import { registarAudit } from "@/lib/audit";

// PATCH — alterar role de um membro
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!podeGerir(role)) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const lojaId = await getLojaId();
  const { novoRole } = await req.json();

  if (!ROLES_ATRIBUIVEIS.includes(novoRole)) {
    return NextResponse.json({ erro: "Role inválido" }, { status: 400 });
  }

  const membro = await prisma.user.findUnique({ where: { id: params.id } });
  if (!membro || membro.lojaId !== lojaId) {
    return NextResponse.json({ erro: "Membro não encontrado" }, { status: 404 });
  }
  // Não alterar o role do próprio LOJISTA (dono)
  if (membro.role === "LOJISTA") {
    return NextResponse.json({ erro: "Não é possível alterar o role do proprietário." }, { status: 403 });
  }

  await prisma.user.update({ where: { id: params.id }, data: { role: novoRole } });

  void registarAudit({
    lojaId,
    userId: (session?.user as { id?: string } | undefined)?.id,
    userEmail: session?.user?.email ?? undefined,
    acao: "ATUALIZAR",
    entidade: "Utilizador",
    entidadeId: params.id,
    valoresAntigos: { role: membro.role },
    valoresNovos: { role: novoRole },
  });

  return NextResponse.json({ ok: true });
}

// DELETE — remover membro da equipa (dissocia da loja, não apaga)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!podeGerir(role)) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const lojaId = await getLojaId();
  const membro = await prisma.user.findUnique({ where: { id: params.id } });
  if (!membro || membro.lojaId !== lojaId) {
    return NextResponse.json({ erro: "Membro não encontrado" }, { status: 404 });
  }
  if (membro.role === "LOJISTA") {
    return NextResponse.json({ erro: "Não é possível remover o proprietário." }, { status: 403 });
  }

  // Dissocia da loja (NÃO apaga o utilizador — constraint de segurança)
  await prisma.user.update({ where: { id: params.id }, data: { lojaId: null } });

  void registarAudit({
    lojaId,
    userId: (session?.user as { id?: string } | undefined)?.id,
    userEmail: session?.user?.email ?? undefined,
    acao: "REMOVER",
    entidade: "Utilizador",
    entidadeId: params.id,
    valoresAntigos: { email: membro.email, role: membro.role },
  });

  return NextResponse.json({ ok: true });
}
