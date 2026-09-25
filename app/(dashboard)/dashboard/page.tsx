import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { formatarPreco } from "@/lib/moeda";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { PeriodoSelector } from "@/components/dashboard/periodo-selector";
import { CentroAtencao } from "@/components/dashboard/centro-atencao";
import { calcularIntervalo, formatarVariacao } from "@/lib/periodo";
import { Suspense } from "react";

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  PENDING:    { label: "Pendente",         dot: "bg-yellow-400", bg: "bg-yellow-50",  text: "text-yellow-700" },
  PROCESSING: { label: "Em processamento", dot: "bg-blue-400",   bg: "bg-blue-50",    text: "text-blue-700"   },
  SHIPPED:    { label: "Enviado",          dot: "bg-purple-400", bg: "bg-purple-50",  text: "text-purple-700" },
  DELIVERED:  { label: "Entregue",         dot: "bg-green-400",  bg: "bg-green-50",   text: "text-green-700"  },
  CANCELLED:  { label: "Cancelado",        dot: "bg-red-400",    bg: "bg-red-50",     text: "text-red-700"    },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { periodo?: string };
}) {
  const [session, lojaId] = await Promise.all([auth(), getLojaId()]);
  const nomeUtilizador = session?.user?.name ?? session?.user?.email ?? "Lojista";

  const periodo = searchParams.periodo ?? "30d";
  const { inicio, fim, inicioAnterior, fimAnterior, label: labelPeriodo } = calcularIntervalo(periodo);

  const agora = new Date();

  const [
    loja,
    subscricao,
    totalProdutos,
    totalPedidos,
    totalClientes,
    receitaPeriodo,
    receitaAnterior,
    pedidosPeriodo,
    pedidosAnterior,
    pedidosPendentes,
    ultimosPedidos,
    topProdutos,
    novosClientesResult,
    novosClientesAntResult,
    visitasPeriodo,
    recompraResult,
  ] = await Promise.all([
    prisma.loja.findUnique({ where: { id: lojaId }, select: { moeda: true, corPrimaria: true, nome: true, publicada: true } }),
    prisma.subscricao.findUnique({ where: { lojaId }, select: { plano: { select: { nome: true, limiteProdutos: true } } } }),
    prisma.produto.count({ where: { lojaId, ativo: true } }),
    prisma.pedido.count({ where: { lojaId } }),
    prisma.pedido.groupBy({ by: ["clienteEmail"], where: { lojaId }, _count: true }).then(r => r.length),

    // Receita no período seleccionado
    prisma.pedido.aggregate({
      where: { lojaId, createdAt: { gte: inicio, lte: fim }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    // Receita no período de comparação
    prisma.pedido.aggregate({
      where: { lojaId, createdAt: { gte: inicioAnterior, lte: fimAnterior }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),

    // Pedidos no período seleccionado
    prisma.pedido.count({ where: { lojaId, createdAt: { gte: inicio, lte: fim } } }),
    // Pedidos no período de comparação
    prisma.pedido.count({ where: { lojaId, createdAt: { gte: inicioAnterior, lte: fimAnterior } } }),

    // Sempre os pendentes actuais (independente do período)
    prisma.pedido.count({ where: { lojaId, status: "PENDING" } }),

    prisma.pedido.findMany({
      where: { lojaId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { itens: { take: 1, include: { produto: { select: { titulo: true } } } } },
    }),
    prisma.itemPedido.groupBy({
      by: ["produtoId"],
      where: { pedido: { lojaId, createdAt: { gte: inicio, lte: fim }, status: { not: "CANCELLED" } } },
      _sum: { quantidade: true },
      orderBy: { _sum: { quantidade: "desc" } },
      take: 3,
    }).then(async (items) => {
      const ids = items.map(i => i.produtoId).filter(Boolean) as string[];
      if (ids.length === 0) return [];
      const produtos = await prisma.produto.findMany({ where: { id: { in: ids } }, select: { id: true, titulo: true } });
      return items.map(i => ({
        titulo: produtos.find(p => p.id === i.produtoId)?.titulo ?? "Produto",
        quantidade: i._sum.quantidade ?? 0,
      }));
    }),

    // Novos clientes no período (primeiro pedido dentro do intervalo)
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count FROM (
        SELECT "clienteEmail" FROM pedidos
        WHERE "lojaId" = ${lojaId} AND status != 'CANCELLED'
        GROUP BY "clienteEmail"
        HAVING MIN("createdAt") >= ${inicio} AND MIN("createdAt") <= ${fim}
      ) sub
    `,
    // Novos clientes no período de comparação
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count FROM (
        SELECT "clienteEmail" FROM pedidos
        WHERE "lojaId" = ${lojaId} AND status != 'CANCELLED'
        GROUP BY "clienteEmail"
        HAVING MIN("createdAt") >= ${inicioAnterior} AND MIN("createdAt") <= ${fimAnterior}
      ) sub
    `,

    // Visitas à loja no período (para taxa de conversão)
    prisma.eventoPlataforma.count({
      where: { lojaId, tipo: "store_view", dia: { gte: inicio, lte: fim } },
    }),

    // Taxa de recompra: total clientes e clientes com 2+ pedidos
    prisma.$queryRaw<[{ total: bigint; repetentes: bigint }]>`
      SELECT
        COUNT(DISTINCT "clienteEmail")::bigint AS total,
        COUNT(DISTINCT CASE WHEN pedido_count > 1 THEN "clienteEmail" END)::bigint AS repetentes
      FROM (
        SELECT "clienteEmail", COUNT(*) AS pedido_count
        FROM pedidos
        WHERE "lojaId" = ${lojaId} AND status != 'CANCELLED'
        GROUP BY "clienteEmail"
      ) sub
    `,
  ]);

  const moeda = loja?.moeda ?? "EUR";
  const cor = loja?.corPrimaria ?? "#153DFC";
  const limiteProdutos = subscricao?.plano?.limiteProdutos ?? null;
  const nomePlano = subscricao?.plano?.nome ?? null;
  const isNovaLoja = totalProdutos === 0 && totalPedidos === 0;

  const receitaAtual = Number(receitaPeriodo._sum.total ?? 0);
  const receitaAnt = Number(receitaAnterior._sum.total ?? 0);
  const { texto: subReceita, positivo: posReceita } = formatarVariacao(receitaAtual, receitaAnt);
  const { texto: subPedidos, positivo: posPedidos } = formatarVariacao(pedidosPeriodo, pedidosAnterior);

  // Ticket médio
  const ticketMedio = pedidosPeriodo > 0 ? receitaAtual / pedidosPeriodo : 0;
  const ticketMedioAnt = pedidosAnterior > 0 ? receitaAnt / pedidosAnterior : 0;
  const { texto: subTicket, positivo: posTicket } = formatarVariacao(ticketMedio, ticketMedioAnt);

  // Novos clientes
  const novosClientes = Number(novosClientesResult[0]?.count ?? 0);
  const novosClientesAnt = Number(novosClientesAntResult[0]?.count ?? 0);
  const { texto: subNovosClientes, positivo: posNovosClientes } = formatarVariacao(novosClientes, novosClientesAnt);

  // Taxa de conversão (visitas → pedidos)
  const taxaConversao = visitasPeriodo > 0 ? (pedidosPeriodo / visitasPeriodo) * 100 : null;

  // Taxa de recompra
  const totalClientesRecompra = Number(recompraResult[0]?.total ?? 0);
  const clientesRepetentes = Number(recompraResult[0]?.repetentes ?? 0);
  const taxaRecompra = totalClientesRecompra > 0 ? (clientesRepetentes / totalClientesRecompra) * 100 : null;

  const horaAtual = agora.getHours();
  const saudacao = horaAtual < 12 ? "Bom dia" : horaAtual < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{saudacao}, {nomeUtilizador.split(" ")[0]} 👋</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {agora.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {!loja?.publicada && (
              <Link href="/dashboard/configuracoes"
                className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Loja não publicada
              </Link>
            )}
            {/* Suspense necessário para useSearchParams no filho */}
            <Suspense fallback={
              <div className="h-9 w-36 rounded-xl bg-slate-100 animate-pulse" />
            }>
              <PeriodoSelector periodoAtual={periodo} />
            </Suspense>
          </div>
        </div>

        {/* Centro de Atenção */}
        <Suspense fallback={null}>
          <CentroAtencao
            lojaId={lojaId}
            inicio={inicio}
            fim={fim}
            inicioAnterior={inicioAnterior}
            fimAnterior={fimAnterior}
          />
        </Suspense>

        {/* Stats principais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: `Receita — ${labelPeriodo}`,
              value: formatarPreco(receitaAtual, moeda),
              icon: "💰",
              sub: subReceita,
              positivo: posReceita,
              href: "/dashboard/pedidos",
            },
            {
              label: `Pedidos — ${labelPeriodo}`,
              value: pedidosPeriodo.toString(),
              icon: "📦",
              sub: subPedidos,
              positivo: posPedidos,
              href: "/dashboard/pedidos",
            },
            {
              label: "Pendentes agora",
              value: pedidosPendentes.toString(),
              icon: "⏳",
              sub: pedidosPendentes > 0 ? "Requerem atenção" : "Tudo em dia ✓",
              positivo: pedidosPendentes === 0 ? true : null,
              href: "/dashboard/pedidos?status=pending",
            },
            {
              label: "Produtos ativos",
              value: limiteProdutos ? `${totalProdutos}/${limiteProdutos}` : totalProdutos.toString(),
              icon: "🏷️",
              sub: limiteProdutos && totalProdutos >= limiteProdutos ? "Limite atingido" : `${totalClientes} clientes únicos`,
              positivo: limiteProdutos && totalProdutos >= limiteProdutos ? false : null,
              href: "/dashboard/produtos",
            },
          ].map((s) => (
            <Link key={s.label} href={s.href}
              className="group bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
              <div className="text-2xl mb-3">{s.icon}</div>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              {s.sub && (
                <p className={`text-xs font-medium mt-2 ${s.positivo === true ? "text-green-600" : s.positivo === false ? "text-red-500" : "text-slate-400"}`}>
                  {s.sub}
                </p>
              )}
            </Link>
          ))}
        </div>

        {/* KPIs de performance */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: `Ticket médio — ${labelPeriodo}`,
              value: ticketMedio > 0 ? formatarPreco(ticketMedio, moeda) : "—",
              icon: "🎯",
              sub: ticketMedio > 0 ? subTicket : "Sem pedidos no período",
              positivo: ticketMedio > 0 ? posTicket : null,
            },
            {
              label: `Novos clientes — ${labelPeriodo}`,
              value: novosClientes.toString(),
              icon: "🙋",
              sub: novosClientes > 0 ? subNovosClientes : "Nenhum cliente novo",
              positivo: novosClientes > 0 ? posNovosClientes : null,
            },
            {
              label: `Taxa de conversão — ${labelPeriodo}`,
              value: taxaConversao !== null ? `${taxaConversao.toFixed(1)}%` : "—",
              icon: "📈",
              sub: taxaConversao !== null
                ? `${visitasPeriodo} visitas · ${pedidosPeriodo} pedidos`
                : "Sem dados de visitas",
              positivo: null,
            },
            {
              label: "Taxa de recompra",
              value: taxaRecompra !== null ? `${taxaRecompra.toFixed(1)}%` : "—",
              icon: "🔁",
              sub: taxaRecompra !== null
                ? `${clientesRepetentes} de ${totalClientesRecompra} clientes voltaram`
                : "Sem dados suficientes",
              positivo: taxaRecompra !== null ? (taxaRecompra >= 20 ? true : null) : null,
            },
          ].map((s) => (
            <div key={s.label}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="text-2xl mb-3">{s.icon}</div>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              {s.sub && (
                <p className={`text-xs font-medium mt-2 ${s.positivo === true ? "text-green-600" : s.positivo === false ? "text-red-500" : "text-slate-400"}`}>
                  {s.sub}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Checklist de onboarding para lojas novas */}
        {isNovaLoja && <OnboardingChecklist nomePlano={nomePlano} />}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Últimos pedidos */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Últimos pedidos</h2>
              <Link href="/dashboard/pedidos" className="text-xs font-semibold hover:underline" style={{ color: cor }}>
                Ver todos →
              </Link>
            </div>

            {ultimosPedidos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-4">
                <div className="text-4xl mb-3">📭</div>
                <p className="font-semibold text-slate-600 text-sm">Ainda sem pedidos</p>
                <p className="text-xs text-slate-400 mt-1">Partilhe o link da sua loja para começar a receber</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {ultimosPedidos.map((p) => {
                  const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.PENDING;
                  return (
                    <Link key={p.id} href={`/dashboard/pedidos/${p.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-400 font-bold">#{p.id.slice(-6).toUpperCase()}</span>
                          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 truncate mt-0.5">{p.clienteEmail}</p>
                        {p.itens[0]?.produto?.titulo && (
                          <p className="text-xs text-slate-400 truncate">{p.itens[0].produto.titulo}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black text-slate-900">{formatarPreco(Number(p.total), moeda)}</p>
                        <p className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleDateString("pt-PT")}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Painel direito */}
          <div className="space-y-4">
            {/* Top produtos */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800">Mais vendidos</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">{labelPeriodo}</p>
              </div>
              {topProdutos.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-slate-400">Sem vendas neste período</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {topProdutos.map((p, i) => (
                    <div key={p.titulo} className="flex items-center gap-3 px-5 py-3">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                        style={{ background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : "#cd7c2f" }}>
                        {i + 1}
                      </span>
                      <p className="flex-1 text-sm text-slate-700 truncate">{p.titulo}</p>
                      <p className="text-xs font-bold text-slate-500">{p.quantidade} un.</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Atalhos */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Atalhos</p>
              {[
                { label: "Adicionar produto", href: "/dashboard/produtos", icon: "➕" },
                { label: "Ver pedidos pendentes", href: "/dashboard/pedidos?status=pending", icon: "⏳" },
                { label: "Relatórios", href: "/dashboard/relatorios", icon: "📊" },
                { label: "Clientes", href: "/dashboard/clientes", icon: "👥" },
                { label: "Marketing", href: "/dashboard/marketing", icon: "🏷️" },
                { label: "Configurações", href: "/dashboard/configuracoes", icon: "⚙️" },
              ].map((a) => (
                <Link key={a.href} href={a.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium">
                  <span>{a.icon}</span>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
