import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { libertarReserva } from "@/lib/inventario";
import { criarNotificacao } from "@/lib/notificacoes";

// TTL da reserva: pedidos PENDING sem actividade após este tempo são expirados
const TTL_HORAS = 2;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const limite = new Date(Date.now() - TTL_HORAS * 60 * 60 * 1000);

  // Pedidos PENDING criados há mais de TTL_HORAS (exclui já cancelados por expirar-reservas)
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
        // Cancela o pedido — where inclui status para evitar duplo-cancelamento se
        // expirar-reservas já cancelou entretanto; updateMany devolve count sem lançar erro
        const { count } = await tx.pedido.updateMany({
          where: { id: pedido.id, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
        if (count === 0) return; // já cancelado por outro cron — nada a fazer
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

  // Verificar stock baixo e esgotado após libertar reservas
  try {
    const produtosCriticos = await prisma.$queryRaw<
      { lojaId: string; id: string; titulo: string; stock: number; stockMinimo: number | null; esgotado: boolean }[]
    >`
      SELECT "lojaId", id, titulo,
        (stock - "stockReservado") AS stock,
        "stockMinimo",
        (stock - "stockReservado") <= 0 AS esgotado
      FROM produtos
      WHERE ativo = true
        AND "stockMinimo" IS NOT NULL
        AND (stock - "stockReservado") <= "stockMinimo"
      ORDER BY "lojaId", (stock - "stockReservado") ASC
    `;

    for (const p of produtosCriticos) {
      const tipo = p.esgotado ? "stock_esgotado" : "stock_baixo";
      const titulo = p.esgotado ? "Produto esgotado" : "Stock baixo";
      const mensagem = p.esgotado
        ? `"${p.titulo}" está esgotado.`
        : `"${p.titulo}" tem apenas ${p.stock} unidade${p.stock !== 1 ? "s" : ""} (mínimo: ${p.stockMinimo}).`;
      void criarNotificacao({
        lojaId: p.lojaId,
        tipo,
        titulo,
        mensagem,
        link: `/dashboard/produtos`,
      });
    }
  } catch {
    // não critico
  }

  console.log(`[cron/libertar-reservas] Libertados: ${libertados}, Erros: ${erros.length}`);
  return NextResponse.json({ libertados, erros });
}
