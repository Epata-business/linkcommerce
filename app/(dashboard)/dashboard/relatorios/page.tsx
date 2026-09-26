import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { formatarPreco } from "@/lib/moeda";
import { BackButton } from "@/components/ui/back-button";
import { RelatoriosClient } from "./relatorios-client";
import { PeriodoSelector } from "@/components/dashboard/periodo-selector";
import { calcularIntervalo } from "@/lib/periodo";
import { Suspense } from "react";

type DiaRow = { dia: Date; receita: string; pedidos: bigint };

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: { periodo?: string };
}) {
  const lojaId = await getLojaId();
  const periodo = searchParams.periodo ?? "30d";
  const { inicio, fim, label: labelPeriodo } = calcularIntervalo(periodo);

  const [loja, dadosDiarios, receitaMeses, totalPedidos, totalReceita, pedidosPorStatus, pedidosPorCanal, topProdutos, pagamentosPorMetodo] = await Promise.all([
    prisma.loja.findUnique({
      where: { id: lojaId },
      select: { moeda: true, corPrimaria: true },
    }),

    // Receita por dia no período selecionado
    prisma.$queryRaw<DiaRow[]>`
      SELECT
        DATE_TRUNC('day', "createdAt") AS dia,
        SUM(total)::text AS receita,
        COUNT(*)::bigint AS pedidos
      FROM pedidos
      WHERE "lojaId" = ${lojaId}
        AND "createdAt" >= ${inicio}
        AND "createdAt" <= ${fim}
        AND status != 'CANCELLED'
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY dia ASC
    `,

    // Últimos 12 meses para o gráfico mensal
    (async () => {
      const agora = new Date();
      const meses = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(agora.getFullYear(), agora.getMonth() - (11 - i), 1);
        return {
          inicio: d,
          fim: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
          label: d.toLocaleDateString("pt-AO", { month: "short" }),
        };
      });
      return Promise.all(
        meses.map(m =>
          prisma.pedido.aggregate({
            where: { lojaId, createdAt: { gte: m.inicio, lte: m.fim }, status: { not: "CANCELLED" } },
            _sum: { total: true },
            _count: true,
          }).then(r => ({ label: m.label, receita: Number(r._sum.total ?? 0), pedidos: r._count }))
        )
      );
    })(),

    // Totais globais
    prisma.pedido.count({ where: { lojaId } }),
    prisma.pedido.aggregate({ where: { lojaId, status: { not: "CANCELLED" } }, _sum: { total: true } }),
    prisma.pedido.groupBy({ by: ["status"], where: { lojaId }, _count: true }),
    prisma.pedido.groupBy({ by: ["channel"], where: { lojaId }, _count: true }),

    // Top 5 produtos (global)
    prisma.itemPedido.groupBy({
      by: ["produtoId"],
      where: { pedido: { lojaId, status: { not: "CANCELLED" } } },
      _sum: { quantidade: true },
      orderBy: { _sum: { quantidade: "desc" } },
      take: 5,
    }).then(async (items) => {
      const ids = items.map(i => i.produtoId).filter(Boolean) as string[];
      if (ids.length === 0) return [];
      const produtos = await prisma.produto.findMany({ where: { id: { in: ids } }, select: { id: true, titulo: true } });
      return items.map(i => ({
        titulo: produtos.find(p => p.id === i.produtoId)?.titulo ?? "Produto",
        quantidade: Number(i._sum.quantidade ?? 0),
      }));
    }),

    // Métodos de pagamento no período
    prisma.pagamento.groupBy({
      by: ["metodo"],
      where: { lojaId, status: "CONFIRMADO", criadoEm: { gte: inicio, lte: fim } },
      _count: true,
    }),
  ]);

  const moeda = loja?.moeda ?? "EUR";
  const cor = loja?.corPrimaria ?? "#153DFC";

  const statusLabels: Record<string, string> = {
    PENDING: "Pendente", PROCESSING: "Em processamento",
    SHIPPED: "Enviado", DELIVERED: "Entregue", CANCELLED: "Cancelado",
  };

  const metodoLabels: Record<string, string> = {
    CARTAO: "Cartão", MBWAY: "MB Way", MULTIBANCO: "Multibanco",
    PAYPAL: "PayPal", MULTICAIXA: "Multicaixa", NA_ENTREGA: "Na entrega",
    TRANSFERENCIA: "Transferência", DESCONHECIDO: "Outros",
  };

  // Preencher dias sem dados com 0
  const diasDoIntervalo: { label: string; receita: number; pedidos: number }[] = [];
  const cursor = new Date(inicio);
  cursor.setHours(0, 0, 0, 0);
  const fimDate = new Date(fim);
  fimDate.setHours(0, 0, 0, 0);
  while (cursor <= fimDate) {
    const chave = cursor.toISOString().slice(0, 10);
    const found = dadosDiarios.find(d => new Date(d.dia).toISOString().slice(0, 10) === chave);
    diasDoIntervalo.push({
      label: cursor.toLocaleDateString("pt-PT", { day: "numeric", month: "short" }),
      receita: found ? parseFloat(found.receita) : 0,
      pedidos: found ? Number(found.pedidos) : 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const receitaPeriodo = diasDoIntervalo.reduce((s, d) => s + d.receita, 0);
  const pedidosPeriodo = diasDoIntervalo.reduce((s, d) => s + d.pedidos, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <BackButton href="/dashboard" label="← Dashboard" />

        <div className="flex items-center justify-between mt-4 mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Analytics</h1>
            <p className="text-slate-400 text-sm mt-1">Análise do desempenho da sua loja</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Suspense fallback={<div className="h-9 w-36 rounded-xl bg-slate-100 animate-pulse" />}>
              <PeriodoSelector periodoAtual={periodo} />
            </Suspense>
            <a
              href="/api/exportar/pedidos"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-all"
              style={{ background: `linear-gradient(135deg, ${cor}, ${cor}bb)` }}
            >
              ⬇️ Exportar CSV
            </a>
          </div>
        </div>

        {/* KPIs do período */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: "💰", label: `Receita — ${labelPeriodo}`, value: formatarPreco(receitaPeriodo, moeda) },
            { icon: "📦", label: `Pedidos — ${labelPeriodo}`, value: pedidosPeriodo.toString() },
            { icon: "💰", label: "Receita total",  value: formatarPreco(Number(totalReceita._sum.total ?? 0), moeda) },
            { icon: "📊", label: "Total pedidos",  value: totalPedidos.toString() },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="text-2xl mb-2">{kpi.icon}</div>
              <p className="text-xl font-black text-slate-900 leading-tight">{kpi.value}</p>
              <p className="text-xs text-slate-400 mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>

        <RelatoriosClient
          diasDoIntervalo={diasDoIntervalo}
          receitaMeses={receitaMeses}
          topProdutos={topProdutos}
          pedidosPorStatus={pedidosPorStatus.map(s => ({ status: statusLabels[s.status] ?? s.status, count: s._count }))}
          pedidosPorCanal={pedidosPorCanal.map(c => ({ canal: c.channel, count: c._count }))}
          pagamentosPorMetodo={pagamentosPorMetodo.map(p => ({ metodo: metodoLabels[p.metodo] ?? p.metodo, count: p._count }))}
          moeda={moeda}
          cor={cor}
          labelPeriodo={labelPeriodo}
        />
      </div>
    </div>
  );
}
