import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enviarEmailSubscricaoAOA } from "@/lib/email";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN_PLATAFORMA") {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  const { acao } = await req.json(); // "aprovar" | "rejeitar"
  if (!["aprovar", "rejeitar"].includes(acao)) {
    return NextResponse.json({ erro: "Acção inválida" }, { status: 400 });
  }

  const subscricao = await prisma.subscricao.findUnique({
    where: { id: params.id },
    include: {
      loja: {
        select: { nome: true, utilizadores: { where: { role: "LOJISTA" }, select: { email: true }, take: 1 } },
      },
      plano: { select: { nome: true } },
    },
  });
  if (!subscricao) return NextResponse.json({ erro: "Subscrição não encontrada" }, { status: 404 });

  if (acao === "aprovar") {
    const proximaCobranca = new Date();
    proximaCobranca.setMonth(proximaCobranca.getMonth() + 1);

    await prisma.subscricao.update({
      where: { id: params.id },
      data: { status: "ATIVA", proximaCobranca },
    });
    await prisma.loja.update({
      where: { id: subscricao.lojaId },
      data: { planoId: subscricao.planoId },
    });

    const emailLojista = subscricao.loja.utilizadores[0]?.email;
    if (emailLojista) {
      void enviarEmailSubscricaoAOA({
        emailLojista,
        nomeLoja: subscricao.loja.nome,
        nomePlano: subscricao.plano.nome,
        aprovado: true,
      });
    }
  } else {
    const planoFree = await prisma.plano.findFirst({ where: { slug: "free" } });
    await prisma.subscricao.update({
      where: { id: params.id },
      data: {
        status: "CANCELADA",
        comprovanteUrl: null,
        ...(planoFree ? { planoId: planoFree.id } : {}),
      },
    });

    const emailLojista = subscricao.loja.utilizadores[0]?.email;
    if (emailLojista) {
      void enviarEmailSubscricaoAOA({
        emailLojista,
        nomeLoja: subscricao.loja.nome,
        nomePlano: subscricao.plano.nome,
        aprovado: false,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
