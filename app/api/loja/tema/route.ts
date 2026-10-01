import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { TEMAS } from "@/lib/temas";
import { auth } from "@/lib/auth";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const lojaId = await getLojaId();
  if (!lojaId) return NextResponse.json({ erro: "Loja não encontrada" }, { status: 404 });

  const { tema } = await req.json();
  if (!TEMAS.find(t => t.slug === tema)) {
    return NextResponse.json({ erro: "Tema inválido" }, { status: 400 });
  }

  // Temas Pro requerem plano activo
  const temaObj = TEMAS.find(t => t.slug === tema)!;
  if (temaObj.plano === "pro") {
    const loja = await prisma.loja.findUnique({
      where: { id: lojaId },
      select: { subscricao: { select: { status: true } }, plano: { select: { id: true } } },
    });
    const temPlano = loja?.subscricao?.status === "ATIVA" || loja?.plano != null;
    if (!temPlano) {
      return NextResponse.json({ erro: "Tema Pro requer subscrição activa" }, { status: 403 });
    }
  }

  await prisma.loja.update({ where: { id: lojaId }, data: { tema } });
  return NextResponse.json({ ok: true, tema });
}
