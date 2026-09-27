import { prisma } from "@/lib/prisma";

/** Atribui pontos após uma compra confirmada. Fire-and-forget. */
export async function atribuirPontos({
  lojaId,
  clienteEmail,
  clienteNome,
  pedidoId,
  totalCompra,
}: {
  lojaId: string;
  clienteEmail: string;
  clienteNome?: string | null;
  pedidoId: string;
  totalCompra: number;
}) {
  const config = await prisma.configFidelidade.findUnique({ where: { lojaId } });
  if (!config || !config.ativo) return;

  const pontos = Math.floor(totalCompra * Number(config.pontosPorUnidade));
  if (pontos <= 0) return;

  await prisma.$transaction(async (tx) => {
    const saldo = await tx.pontosFidelidade.upsert({
      where: { lojaId_clienteEmail: { lojaId, clienteEmail } },
      create: { lojaId, clienteEmail, clienteNome: clienteNome ?? null, pontos, totalGanho: pontos },
      update: {
        pontos: { increment: pontos },
        totalGanho: { increment: pontos },
        clienteNome: clienteNome ?? undefined,
      },
    });
    await tx.movimentoPontos.create({
      data: {
        saldoId: saldo.id,
        tipo: "GANHO",
        pontos,
        pedidoId,
        nota: `Compra #${pedidoId.slice(-8).toUpperCase()}`,
      },
    });
  });
}

/** Retorna o saldo de pontos de um cliente, ou null se o programa não está ativo. */
export async function obterSaldoPontos(lojaId: string, clienteEmail: string) {
  const config = await prisma.configFidelidade.findUnique({ where: { lojaId } });
  if (!config || !config.ativo) return null;
  const saldo = await prisma.pontosFidelidade.findUnique({
    where: { lojaId_clienteEmail: { lojaId, clienteEmail } },
    select: { pontos: true, totalGanho: true },
  });
  return {
    pontos: saldo?.pontos ?? 0,
    totalGanho: saldo?.totalGanho ?? 0,
    valorPorPonto: Number(config.valorPorPonto),
    pontosMinResgatar: config.pontosMinResgatar,
  };
}
