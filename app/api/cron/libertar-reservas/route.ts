import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { libertarReserva } from "@/lib/inventario";

// TTL da reserva: pedidos PENDING sem actividade após este tempo são expirados
const TTL_HORAS = 2;

export async function GET(req: NextRequest) {
  // Autenticação por secret header (definido em Vercel Environment Variables)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
    }
  }

  const limite = new Date(Date.now() - TTL_HORAS * 60 * 60 * 1000);

  // Pedidos PENDING criados há mais de TTL_HORAS
  const pedidosExpirados = await prisma.pedido.findMany({
    where: {
      status: "PENDING",
      createdAt: { lt: limite },
    },
    select: {
      id: true,
      lojaId: true,
      itens: { select: { produtoId: true, varianteId: true, quantidade: true } },
    },
  });

  if (pedidosExpirados.length === 0) {
    console.log("[cron/libertar-reservas] Nenhum pedido expirado.");
    return NextResponse.json({ libertados: 0 });
  }

  let libertados = 0;
  const erros: string[] = [];

  for (const pedido of pedidosExpirados) {
    const itensReserva = pedido.itens.map((i) => ({
      produtoId: i.produtoId,
      varianteId: i.varianteId ?? null,
      quantidade: i.quantidade,
    }));

    try {
      await prisma.$transaction(async (tx) => {
        // Cancela o pedido
        await tx.pedido.update({
          where: { id: pedido.id },
          data: { status: "CANCELLED" },
        });
        // Liberta a reserva de stock
        await libertarReserva(
          tx,
          pedido.lojaId,
          pedido.id,
          itensReserva,
          "RESERVA_EXPIRADA",
          `Reserva expirada após ${TTL_HORAS}h sem pagamento`,
        );
      });
      libertados++;
    } catch (err) {
      console.error(`[cron/libertar-reservas] Erro no pedido ${pedido.id}:`, err);
      erros.push(pedido.id);
    }
  }

  console.log(`[cron/libertar-reservas] Libertados: ${libertados}, Erros: ${erros.length}`);
  return NextResponse.json({ libertados, erros });
}
