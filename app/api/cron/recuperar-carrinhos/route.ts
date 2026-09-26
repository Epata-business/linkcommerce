import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarEmailCarrinhoAbandonado } from "@/lib/email";

// Janela de abandono: enviar email se carrinho criado há 1–24h e ainda ABANDONADO
const HORAS_MIN = 1;
const HORAS_MAX = 24;
const BATCH = 30;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const agora = new Date();
  const limiteMin = new Date(agora.getTime() - HORAS_MIN * 60 * 60 * 1000);
  const limiteMax = new Date(agora.getTime() - HORAS_MAX * 60 * 60 * 1000);

  const carrinhos = await prisma.carrinhoAbandonado.findMany({
    where: {
      status: "ABANDONADO",
      criadoEm: { lte: limiteMin, gte: limiteMax },
    },
    include: { loja: { select: { nome: true, subdominio: true, moeda: true } } },
    take: BATCH,
    orderBy: { criadoEm: "asc" },
  });

  let enviados = 0;
  let erros = 0;

  for (const carrinho of carrinhos) {
    try {
      const itens = (carrinho.itens as {
        titulo: string;
        precoUnitario: number;
        quantidade: number;
        imagemUrl?: string | null;
      }[]);

      await enviarEmailCarrinhoAbandonado({
        nomeLoja: carrinho.loja.nome,
        clienteEmail: carrinho.clienteEmail,
        clienteNome: carrinho.clienteNome ?? "Cliente",
        itens,
        total: Number(carrinho.total),
        moeda: carrinho.moeda,
        urlLoja: `https://${carrinho.loja.subdominio}.linkcommerce.cc`,
      });

      await prisma.carrinhoAbandonado.update({
        where: { id: carrinho.id },
        data: { status: "EMAIL_ENVIADO", emailEnviadoEm: agora },
      });
      enviados++;
    } catch {
      erros++;
    }
  }

  return NextResponse.json({ processados: carrinhos.length, enviados, erros });
}
