import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LOTE = 50;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const agora = new Date();

  // Buscar reservas expiradas em lote
  const reservas = await prisma.stockReserva.findMany({
    where: { status: "ACTIVA", expiresAt: { lt: agora } },
    take: LOTE,
    select: {
      id: true,
      lojaId: true,
      pedidoId: true,
      produtoId: true,
      varianteId: true,
      quantidade: true,
    },
  });

  if (reservas.length === 0) {
    return NextResponse.json({ processadas: 0 });
  }

  let processadas = 0;
  let erros = 0;

  for (const reserva of reservas) {
    try {
      await prisma.$transaction(async (tx) => {
        // Decrementar stockReservado
        if (reserva.varianteId) {
          await tx.variante.update({
            where: { id: reserva.varianteId },
            data: { stockReservado: { decrement: reserva.quantidade } },
          });
        } else {
          await tx.produto.update({
            where: { id: reserva.produtoId },
            data: { stockReservado: { decrement: reserva.quantidade } },
          });
        }

        // Marcar como expirada
        await tx.stockReserva.update({
          where: { id: reserva.id },
          data: { status: "EXPIRADA", resolvidaEm: agora },
        });

        // Log de auditoria
        await tx.movimentoStock.create({
          data: {
            lojaId: reserva.lojaId,
            produtoId: reserva.produtoId,
            varianteId: reserva.varianteId ?? null,
            tipo: "RESERVA_EXPIRADA",
            quantidade: reserva.quantidade,
            pedidoId: reserva.pedidoId ?? null,
            reservaId: reserva.id,
            nota: "Reserva expirada automaticamente pelo cron",
          },
        });
      });
      processadas++;
    } catch {
      erros++;
    }
  }

  return NextResponse.json({ processadas, erros, total: reservas.length });
}
