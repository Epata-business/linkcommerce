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
import { TODOS_OS_TEMAS } from "@/lib/temas";
import {
  Banknote, ShoppingBag, Clock, Tag,
  Target, UserPlus, TrendingUp, RefreshCw,
  Inbox, Plus, BarChart2, Users, Megaphone,
  Share2, Settings, type LucideIcon,
} from "lucide-react";

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
  searchParams: { periodo?: string; inicio?: string; fim?: string };
}) {
  const [session, lojaId] = await Promise.all([auth(), getLojaId()]);
  const nomeUtilizador = session?.user?.name ?? session?.user?.email ?? "Lojista";
  const temaActivo = await prisma.loja.findUnique({ where: { id: lojaId }, select: { tema: true } }).then(l => l?.tema ?? "essencial");

  const periodo = searchParams.periodo ?? "30d";
  const { inicio, fim, inicioAnterior, fimAnterior, label: labelPeriodo } = calcularIntervalo(periodo, searchParams.inicio, searchParams.fim);

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
    <div className="min-h-screen" style={{ background: "#F7F8FC" }}>
      <div className="max-w-5xl mx-auto px-5 py-7 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#0F1117] tracking-tight">{saudacao}, {nomeUtilizador.split(" ")[0]}</h1>
            <p className="text-[#9CA3AF] text-sm mt-0.5">
              {agora.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {!loja?.publicada && (
              <Link href="/dashboard/configuracoes"
                className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Loja não publicada
              </Link>
            )}
            <Suspense fallback={<div className="h-9 w-36 rounded-xl bg-white border border-[hsl(220_20%_91%)] animate-pulse" />}>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: `Receita`,
              period: labelPeriodo,
              value: formatarPreco(receitaAtual, moeda),
              Icon: Banknote as LucideIcon,
              accent: "#153DEC",
              sub: subReceita,
              positivo: posReceita,
              href: "/dashboard/pedidos",
            },
            {
              label: `Encomendas`,
              period: labelPeriodo,
              value: pedidosPeriodo.toString(),
              Icon: ShoppingBag as LucideIcon,
              accent: "#8381FB",
              sub: subPedidos,
              positivo: posPedidos,
              href: "/dashboard/pedidos",
            },
            {
              label: "Pendentes",
              period: "agora",
              value: pedidosPendentes.toString(),
              Icon: Clock as LucideIcon,
              accent: pedidosPendentes > 0 ? "#f59e0b" : "#10b981",
              sub: pedidosPendentes > 0 ? "Requerem atenção" : "Tudo em dia",
              positivo: pedidosPendentes === 0 ? true : null,
              href: "/dashboard/pedidos?status=pending",
            },
            {
              label: "Produtos activos",
              period: null,
              value: limiteProdutos ? `${totalProdutos}/${limiteProdutos}` : totalProdutos.toString(),
              Icon: Tag as LucideIcon,
              accent: "#153DEC",
              sub: limiteProdutos && totalProdutos >= limiteProdutos ? "Limite atingido" : `${totalClientes} clientes únicos`,
              positivo: limiteProdutos && totalProdutos >= limiteProdutos ? false : null,
              href: "/dashboard/produtos",
            },
          ].map((s) => (
            <Link key={s.label} href={s.href}
              className="group bg-white rounded-2xl p-5 transition-all duration-150"
              style={{ border: "1px solid hsl(220 20% 91%)", boxShadow: "0 1px 3px rgba(15,17,23,0.04)" }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${s.accent}14` }}>
                  <s.Icon className="w-4 h-4" style={{ color: s.accent }} strokeWidth={1.75} />
                </div>
                {s.period && (
                  <span className="text-[10px] font-semibold text-[#9CA3AF] bg-[#F7F8FC] px-2 py-1 rounded-full">
                    {s.period}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-[#0F1117] tabular-nums">{s.value}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5 font-medium">{s.label}</p>
              {s.sub && (
                <p className={`text-[11px] font-semibold mt-2.5 ${s.positivo === true ? "text-emerald-600" : s.positivo === false ? "text-red-500" : "text-[#9CA3AF]"}`}>
                  {s.sub}
                </p>
              )}
            </Link>
          ))}
        </div>

        {/* KPIs de performance */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Ticket médio",
              value: ticketMedio > 0 ? formatarPreco(ticketMedio, moeda) : "—",
              Icon: Target as LucideIcon,
              sub: ticketMedio > 0 ? subTicket : "Sem encomendas no período",
              positivo: ticketMedio > 0 ? posTicket : null,
            },
            {
              label: "Novos clientes",
              value: novosClientes.toString(),
              Icon: UserPlus as LucideIcon,
              sub: novosClientes > 0 ? subNovosClientes : "Nenhum cliente novo",
              positivo: novosClientes > 0 ? posNovosClientes : null,
            },
            {
              label: "Taxa de conversão",
              value: taxaConversao !== null ? `${taxaConversao.toFixed(1)}%` : "—",
              Icon: TrendingUp as LucideIcon,
              sub: taxaConversao !== null
                ? `${visitasPeriodo} visitas · ${pedidosPeriodo} encomendas`
                : "Sem dados de visitas",
              positivo: null,
            },
            {
              label: "Taxa de recompra",
              value: taxaRecompra !== null ? `${taxaRecompra.toFixed(1)}%` : "—",
              Icon: RefreshCw as LucideIcon,
              sub: taxaRecompra !== null
                ? `${clientesRepetentes} de ${totalClientesRecompra} clientes voltaram`
                : "Sem dados suficientes",
              positivo: taxaRecompra !== null ? (taxaRecompra >= 20 ? true : null) : null,
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5"
              style={{ border: "1px solid hsl(220 20% 91%)", boxShadow: "0 1px 3px rgba(15,17,23,0.04)" }}>
              <div className="flex items-center gap-2 mb-3">
                <s.Icon className="w-4 h-4 text-[#9CA3AF]" strokeWidth={1.75} />
                <span className="text-xs font-semibold text-[#9CA3AF]">{labelPeriodo}</span>
              </div>
              <p className="text-2xl font-bold text-[#0F1117] tabular-nums">{s.value}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5 font-medium">{s.label}</p>
              {s.sub && (
                <p className={`text-[11px] font-semibold mt-2.5 ${s.positivo === true ? "text-emerald-600" : s.positivo === false ? "text-red-500" : "text-[#9CA3AF]"}`}>
                  {s.sub}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Checklist de onboarding para lojas novas */}
        {isNovaLoja && <OnboardingChecklist nomePlano={nomePlano} />}

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Últimas encomendas */}
          <div className="lg:col-span-2 bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid hsl(220 20% 91%)", boxShadow: "0 1px 3px rgba(15,17,23,0.04)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid hsl(220 20% 95%)" }}>
              <h2 className="font-semibold text-[#0F1117] text-sm">Últimas encomendas</h2>
              <Link href="/dashboard/pedidos" className="text-xs font-semibold text-[#153DEC] hover:text-[#1234D0] transition-colors">
                Ver todas →
              </Link>
            </div>

            {ultimosPedidos.length === 0 ? (
              <div className="empty-state py-14">
                <div className="empty-state-icon"><Inbox className="w-10 h-10 text-[#9CA3AF]" strokeWidth={1.5} /></div>
                <p className="empty-state-title">Ainda sem encomendas</p>
                <p className="empty-state-desc">Partilhe o link da sua loja para começar a receber</p>
              </div>
            ) : (
              <div>
                {ultimosPedidos.map((p) => {
                  const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.PENDING;
                  return (
                    <Link key={p.id} href={`/dashboard/pedidos/${p.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[#F7F8FC]"
                      style={{ borderBottom: "1px solid hsl(220 20% 95%)" }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-xs text-[#9CA3AF] font-semibold">#{p.id.slice(-6).toUpperCase()}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-[#0F1117] truncate font-medium">{p.clienteEmail}</p>
                        {p.itens[0]?.produto?.titulo && (
                          <p className="text-xs text-[#9CA3AF] truncate mt-0.5">{p.itens[0].produto.titulo}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[#0F1117] tabular-nums">{formatarPreco(Number(p.total), moeda)}</p>
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5">{new Date(p.createdAt).toLocaleDateString("pt-PT")}</p>
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
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid hsl(220 20% 91%)", boxShadow: "0 1px 3px rgba(15,17,23,0.04)" }}>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid hsl(220 20% 95%)" }}>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-[#0F1117] text-sm">Mais vendidos</h2>
                  <span className="text-[10px] font-semibold text-[#9CA3AF] bg-[#F7F8FC] px-2 py-1 rounded-full">{labelPeriodo}</span>
                </div>
              </div>
              {topProdutos.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-[#9CA3AF]">Sem vendas neste período</p>
                </div>
              ) : (
                <div>
                  {topProdutos.map((p, i) => (
                    <div key={p.titulo} className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid hsl(220 20% 97%)" }}>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : "#b45309" }}>
                        {i + 1}
                      </span>
                      <p className="flex-1 text-sm text-[#0F1117] truncate font-medium">{p.titulo}</p>
                      <p className="text-xs font-semibold text-[#9CA3AF] tabular-nums">{p.quantidade} un.</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Atalhos rápidos */}
            <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid hsl(220 20% 91%)", boxShadow: "0 1px 3px rgba(15,17,23,0.04)" }}>
              <p className="label mb-3">Atalhos</p>
              <div className="space-y-0.5">
                {[
                  { label: "Adicionar produto", href: "/dashboard/produtos", Icon: Plus },
                  { label: "Encomendas pendentes", href: "/dashboard/pedidos?status=pending", Icon: Clock },
                  { label: "Relatórios", href: "/dashboard/relatorios", Icon: BarChart2 },
                  { label: "Clientes", href: "/dashboard/clientes", Icon: Users },
                  { label: "Marketing", href: "/dashboard/marketing", Icon: Megaphone },
                  { label: "Redes sociais", href: "/dashboard/redes-sociais", Icon: Share2 },
                  { label: "Configurações", href: "/dashboard/configuracoes", Icon: Settings },
                ].map((a) => (
                  <Link key={a.href} href={a.href}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#4B5563] hover:bg-[#F7F8FC] hover:text-[#0F1117] transition-colors font-medium">
                    <a.Icon className="w-4 h-4 opacity-70 flex-shrink-0" strokeWidth={1.75} />
                    {a.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Temas da Loja */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-800">Tema da loja</h2>
              <p className="text-xs text-slate-400 mt-0.5">Escolha o visual da sua loja online</p>
            </div>
            <Link href="/dashboard/temas"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-slate-600">
              Ver todos →
            </Link>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TODOS_OS_TEMAS.map((tema) => {
              const activo = tema.slug === temaActivo;
              return (
                <Link key={tema.slug} href="/dashboard/temas"
                  className={`group relative rounded-xl overflow-hidden border-2 transition-all ${activo ? "border-blue-500 shadow-md" : "border-slate-100 hover:border-slate-300"}`}>
                  {/* Preview image */}
                  <div className="aspect-[4/3] relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tema.previewDesktop} alt={tema.nome}
                      className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  {/* Info */}
                  <div className="absolute bottom-0 inset-x-0 px-2.5 pb-2">
                    <p className="text-white text-xs font-bold truncate">{tema.nome}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${tema.plano === "gratuito" ? "bg-green-500 text-white" : "bg-yellow-400 text-yellow-900"}`}>
                        {tema.plano === "gratuito" ? "INCLUÍDO" : "PRO"}
                      </span>
                      {activo && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-blue-500 text-white">
                          ACTIVO
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="px-5 pb-4 text-center">
            <p className="text-xs text-slate-400">
              {TODOS_OS_TEMAS.filter(t => t.plano === "gratuito").length} temas incluídos · {TODOS_OS_TEMAS.filter(t => t.plano === "pro").length} temas Pro
              {" · "}
              <Link href="/dashboard/temas" className="text-blue-600 font-semibold hover:underline">
                Gerir temas
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
