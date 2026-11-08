import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { checkRateLimit } from "@/lib/rate-limit";

// GET /api/zernio/accounts — lista contas sociais ligadas a esta loja
export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, { prefix: "zernio-accounts", limit: 30, windowSec: 60 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const lojaId = await getLojaId();

  const contas = await prisma.contaSocial.findMany({
    where: { lojaId, ativa: true },
    select: {
      id: true,
      plataforma: true,
      nomeExibido: true,
      accountId: true,
      criadaEm: true,
    },
    orderBy: { criadaEm: "asc" },
  });

  return NextResponse.json({ contas });
}

// DELETE /api/zernio/accounts?id=<contaSocialId> — remove ligação
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ erro: "ID em falta" }, { status: 400 });

  const lojaId = await getLojaId();

  const conta = await prisma.contaSocial.findUnique({ where: { id } });
  if (!conta || conta.lojaId !== lojaId) {
    return NextResponse.json({ erro: "Conta não encontrada" }, { status: 404 });
  }

  await prisma.contaSocial.update({ where: { id }, data: { ativa: false } });

  return NextResponse.json({ ok: true });
}
