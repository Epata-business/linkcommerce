import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { formatarPreco } from "@/lib/moeda";
import { BackButton } from "@/components/ui/back-button";
import { RelatoriosClient } from "./relatorios-client";
import { PeriodoSelector } from "@/components/dashboard/periodo-selector";
import { calcularIntervalo, formatarVariacao } from "@/lib/periodo";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { temPermissao } from "@/lib/rbac";

type DiaRow = { dia: Date; receita: string; pedidos: bigint };

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: { periodo?: string };
}) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!temPermissao(role, "relatorios")) redirect("/dashboard");

  const lojaId = await getLojaId();
  const periodo = searchParams.periodo ?? "30d";
  const { inicio, fim, inicioAnterior, fimAnterior, label: labelPeriodo } = calcularIntervalo(periodo);

  const [
    loja,
    dadosDiarios,
    receitaMeses,
    totalPedidos,
    totalReceita,
    pedidosPorStatus,
    pedidosPorCanal,
    topProdutosPorQtd,
    pagamentosPorMetodo,
    // P14 — métricas avançadas
    receitaPeriodoAnterior,
    pedidosPeriodoAnterior,
    topProdutosPorReceita,
    topClientes,
    clientesNovos,
    ticketMedioPeriodo,
  ] = await Promise.all([
    prisma.loja.findUnique({
      where: { id: lojaId },
      select: { moeda: true, corPrimaria: true },
    }),

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

    prisma.pedido.count({ where: { lojaId } }),
    prisma.pedido.aggregate({ where: { lojaId, status: { not: "CANCELLED" } }, _sum: { total: true } }),
    prisma.pedido.groupBy({ by: ["status"], where: { lojaId }, _count: true }),
    prisma.pedido.groupBy({ by: ["channel"], where: { lojaId }, _count: true }),

    // Top 5 por quantidade (global)
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

    prisma.pagamento.groupBy({
      by: ["metodo"],
      where: { lojaId, status: "CONFIRMADO", criadoEm: { gte: inicio, lte: fim } },
      _count: true,
    }),

    // P14 — receita período anterior
    prisma.pedido.aggregate({
      where: { lojaId, status: { not: "CANCELLED" }, createdAt: { gte: inicioAnterior, lte: fimAnterior } },
      _sum: { total: true },
    }),

    // P14 — pedidos período anterior
    prisma.pedido.count({
      where: { lojaId, status: { not: "CANCELLED" }, createdAt: { gte: inicioAnterior, lte: fimAnterior } },
    }),

    // P14 — top 5 produtos por receita no período
    prisma.itemPedido.groupBy({
      by: ["produtoId"],
      where: {
        pedido: { lojaId, status: { not: "CANCELLED" }, createdAt: { gte: inicio, lte: fim } },
      },
      _sum: { quantidade: true },
      orderBy: { _sum: { quantidade: "desc" } },
      take: 5,
    }).then(async (items) => {
      if (items.length === 0) return [];
      const ids = items.map(i => i.produtoId).filter(Boolean) as string[];
      // Calcular receita real: soma(precoUnitario * quantidade)
      const receitas = await Promise.all(
        ids.map(id =>
          prisma.itemPedido.aggregate({
            where: {
              produtoId: id,
              pedido: { lojaId, status: { not: "CANCELLED" }, createdAt: { gte: inicio, lte: fim } },
            },
            _sum: { quantidade: true },
          }).then(async r => {
            // Buscar preço médio a partir dos itens do período
            const amostra = await prisma.itemPedido.findFirst({
              where: { produtoId: id, pedido: { lojaId } },
              select: { precoUnitario: true },
            });
            const precoUnit = Number(amostra?.precoUnitario ?? 0);
            return { produtoId: id, receita: precoUnit * Number(r._sum.quantidade ?? 0), quantidade: Number(r._sum.quantidade ?? 0) };
          })
        )
      );
      const produtos = await prisma.produto.findMany({ where: { id: { in: ids } }, select: { id: true, titulo: true } });
      return receitas
        .sort((a, b) => b.receita - a.receita)
        .map(r => ({
          titulo: produtos.find(p => p.id === r.produtoId)?.titulo ?? "Produto",
          quantidade: r.quantidade,
          receita: r.receita,
        }));
    }),

    // P14 — top 5 clientes por receita no período
    prisma.pedido.groupBy({
      by: ["clienteEmail", "clienteNome"],
      where: { lojaId, status: { not: "CANCELLED" }, createdAt: { gte: inicio, lte: fim } },
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }).then(rows => rows.map(r => ({
      nome: r.clienteNome ?? r.clienteEmail ?? "—",
      email: r.clienteEmail ?? "",
      receita: Number(r._sum.total ?? 0),
      pedidos: r._count,
    }))),

    // P14 — clientes novos no período (1.º pedido dentro do intervalo)
    prisma.pedido.groupBy({
      by: ["clienteEmail"],
      where: { lojaId },
      _min: { createdAt: true },
    }).then(rows =>
      rows.filter(r => {
        const first = r._min.createdAt;
        return first && first >= inicio && first <= fim;
      }).length
    ),

    // P14 — ticket médio no período
    prisma.pedido.aggregate({
      where: { lojaId, status: { not: "CANCELLED" }, createdAt: { gte: inicio, lte: fim } },
      _avg: { total: true },
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
  const receitaAnteriorNum = Number(receitaPeriodoAnterior._sum.total ?? 0);
  const ticketMedio = Number(ticketMedioPeriodo._avg.total ?? 0);
  const ticketMedioAnterior = pedidosPeriodoAnterior > 0
    ? receitaAnteriorNum / pedidosPeriodoAnterior
    : 0;

  const variacaoReceita = formatarVariacao(receitaPeriodo, receitaAnteriorNum);
  const variacaoPedidos = formatarVariacao(pedidosPeriodo, pedidosPeriodoAnterior);
  const variacaoTicket = formatarVariacao(ticketMedio, ticketMedioAnterior);

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

        {/* KPIs com variação vs período anterior */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: `Receita — ${labelPeriodo}`,
              value: formatarPreco(receitaPeriodo, moeda),
              variacao: variacaoReceita,
            },
            {
              label: `Pedidos — ${labelPeriodo}`,
              value: pedidosPeriodo.toString(),
              variacao: variacaoPedidos,
            },
            {
              label: "Ticket médio",
              value: formatarPreco(ticketMedio, moeda),
              variacao: variacaoTicket,
            },
            {
              label: "Clientes novos",
              value: clientesNovos.toString(),
              variacao: null,
            },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <p className="text-xl font-black text-slate-900 leading-tight">{kpi.value}</p>
              <p className="text-xs text-slate-400 mt-1 mb-2">{kpi.label}</p>
              {kpi.variacao && kpi.variacao.positivo !== null && (
                <p className={`text-[10px] font-bold ${kpi.variacao.positivo ? "text-green-600" : "text-red-500"}`}>
                  {kpi.variacao.positivo ? "▲" : "▼"} {kpi.variacao.texto}
                </p>
              )}
            </div>
          ))}
        </div>

        <RelatoriosClient
          diasDoIntervalo={diasDoIntervalo}
          receitaMeses={receitaMeses}
          topProdutos={topProdutosPorQtd}
          topProdutosPorReceita={topProdutosPorReceita}
          topClientes={topClientes}
          pedidosPorStatus={pedidosPorStatus.map(s => ({ status: statusLabels[s.status] ?? s.status, count: s._count }))}
          pedidosPorCanal={pedidosPorCanal.map(c => ({ canal: c.channel, count: c._count }))}
          pagamentosPorMetodo={pagamentosPorMetodo.map(p => ({ metodo: metodoLabels[p.metodo] ?? p.metodo, count: p._count }))}
          moeda={moeda}
          cor={cor}
          labelPeriodo={labelPeriodo}
          totalGlobal={Number(totalReceita._sum.total ?? 0)}
          totalPedidosGlobal={totalPedidos}
        />
      </div>
    </div>
  );
}
