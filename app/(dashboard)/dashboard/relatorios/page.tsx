import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { formatarPreco } from "@/lib/moeda";
import { BackButton } from "@/components/ui/back-button";
import { RelatoriosClient } from "./relatorios-client";

export default async function RelatoriosPage() {
  const lojaId = await getLojaId();

  const loja = await prisma.loja.findUnique({
    where: { id: lojaId },
    select: { moeda: true, corPrimaria: true },
  });

  const moeda = loja?.moeda ?? "EUR";
  const cor = loja?.corPrimaria ?? "#153DFC";

  // Últimos 6 meses de receita por mês
  const agora = new Date();
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - (5 - i), 1);
    return {
      inicio: d,
      fim: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
      label: d.toLocaleDateString("pt-AO", { month: "short", year: "numeric" }),
    };
  });

  const receitaMeses = await Promise.all(
    meses.map(m =>
      prisma.pedido.aggregate({
        where: { lojaId, createdAt: { gte: m.inicio, lte: m.fim }, status: { not: "CANCELLED" } },
        _sum: { total: true },
        _count: true,
      }).then(r => ({
        label: m.label,
        receita: Number(r._sum.total ?? 0),
        pedidos: r._count,
      }))
    )
  );

  // Totais gerais
  const [totalPedidos, totalReceita, pedidosPorStatus, topProdutos] = await Promise.all([
    prisma.pedido.count({ where: { lojaId } }),
    prisma.pedido.aggregate({
      where: { lojaId, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    prisma.pedido.groupBy({
      by: ["status"],
      where: { lojaId },
      _count: true,
    }),
    prisma.itemPedido.groupBy({
      by: ["produtoId"],
      where: { pedido: { lojaId, status: { not: "CANCELLED" } } },
      _sum: { quantidade: true },
      _sum2: { total: true } as never,
      orderBy: { _sum: { quantidade: "desc" } },
      take: 5,
    }).then(async (items) => {
      const ids = items.map(i => i.produtoId).filter(Boolean) as string[];
      const produtos = await prisma.produto.findMany({
        where: { id: { in: ids } },
        select: { id: true, titulo: true, preco: true },
      });
      return items.map(i => ({
        titulo: produtos.find(p => p.id === i.produtoId)?.titulo ?? "Produto",
        quantidade: i._sum.quantidade ?? 0,
      }));
    }),
  ]);

  const statusLabels: Record<string, string> = {
    PENDING: "Pendente", PROCESSING: "Em processamento",
    SHIPPED: "Enviado", DELIVERED: "Entregue", CANCELLED: "Cancelado",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <BackButton href="/dashboard" label="← Dashboard" />
        <div className="flex items-center justify-between mt-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Relatórios</h1>
            <p className="text-slate-400 text-sm mt-1">Análise do desempenho da sua loja</p>
          </div>
          <a
            href="/api/exportar/pedidos"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-all"
            style={{ background: `linear-gradient(135deg, ${cor}, ${cor}bb)` }}
          >
            ⬇️ Exportar CSV
          </a>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: "💰", label: "Receita total", value: formatarPreco(Number(totalReceita._sum.total ?? 0), moeda) },
            { icon: "📦", label: "Total pedidos", value: totalPedidos.toString() },
            { icon: "✅", label: "Entregues", value: (pedidosPorStatus.find(s => s.status === "DELIVERED")?._count ?? 0).toString() },
            { icon: "⏳", label: "Pendentes", value: (pedidosPorStatus.find(s => s.status === "PENDING")?._count ?? 0).toString() },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="text-2xl mb-2">{kpi.icon}</div>
              <p className="text-xl font-black text-slate-900 leading-tight">{kpi.value}</p>
              <p className="text-xs text-slate-400 mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Gráfico receita + top produtos (client component) */}
        <RelatoriosClient
          dadosMeses={receitaMeses}
          topProdutos={topProdutos}
          pedidosPorStatus={pedidosPorStatus.map(s => ({ status: statusLabels[s.status] ?? s.status, count: s._count }))}
          moeda={moeda}
          cor={cor}
        />
      </div>
    </div>
  );
}
