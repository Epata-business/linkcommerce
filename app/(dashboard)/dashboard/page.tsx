import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { formatarPreco } from "@/lib/moeda";
import Link from "next/link";
import { auth } from "@/lib/auth";

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  PENDING:    { label: "Pendente",         dot: "bg-yellow-400", bg: "bg-yellow-50",  text: "text-yellow-700" },
  PROCESSING: { label: "Em processamento", dot: "bg-blue-400",   bg: "bg-blue-50",    text: "text-blue-700"   },
  SHIPPED:    { label: "Enviado",          dot: "bg-purple-400", bg: "bg-purple-50",  text: "text-purple-700" },
  DELIVERED:  { label: "Entregue",         dot: "bg-green-400",  bg: "bg-green-50",   text: "text-green-700"  },
  CANCELLED:  { label: "Cancelado",        dot: "bg-red-400",    bg: "bg-red-50",     text: "text-red-700"    },
};

export default async function DashboardPage() {
  const [session, lojaId] = await Promise.all([auth(), getLojaId()]);
  const nomeUtilizador = session?.user?.name ?? session?.user?.email ?? "Lojista";

  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const fimMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59);

  const [
    loja,
    totalProdutos,
    totalPedidos,
    totalClientes,
    receitaMes,
    receitaMesAnterior,
    pedidosMes,
    pedidosPendentes,
    ultimosPedidos,
    topProdutos,
  ] = await Promise.all([
    prisma.loja.findUnique({ where: { id: lojaId }, select: { moeda: true, corPrimaria: true, nome: true, publicada: true } }),
    prisma.produto.count({ where: { lojaId, ativo: true } }),
    prisma.pedido.count({ where: { lojaId } }),
    prisma.pedido.groupBy({ by: ["clienteEmail"], where: { lojaId }, _count: true }).then(r => r.length),
    prisma.pedido.aggregate({ where: { lojaId, createdAt: { gte: inicioMes }, status: { not: "CANCELLED" } }, _sum: { total: true } }),
    prisma.pedido.aggregate({ where: { lojaId, createdAt: { gte: inicioMesAnterior, lte: fimMesAnterior }, status: { not: "CANCELLED" } }, _sum: { total: true } }),
    prisma.pedido.count({ where: { lojaId, createdAt: { gte: inicioMes } } }),
    prisma.pedido.count({ where: { lojaId, status: "PENDING" } }),
    prisma.pedido.findMany({
      where: { lojaId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { itens: { take: 1, include: { produto: { select: { titulo: true } } } } },
    }),
    prisma.itemPedido.groupBy({
      by: ["produtoId"],
      where: { pedido: { lojaId, status: { not: "CANCELLED" } } },
      _sum: { quantidade: true },
      orderBy: { _sum: { quantidade: "desc" } },
      take: 3,
    }).then(async (items) => {
      const ids = items.map(i => i.produtoId).filter(Boolean) as string[];
      const produtos = await prisma.produto.findMany({ where: { id: { in: ids } }, select: { id: true, titulo: true } });
      return items.map(i => ({
        titulo: produtos.find(p => p.id === i.produtoId)?.titulo ?? "Produto",
        quantidade: i._sum.quantidade ?? 0,
      }));
    }),
  ]);

  const moeda = loja?.moeda ?? "EUR";
  const cor = loja?.corPrimaria ?? "#153DFC";
  const receitaAtual = Number(receitaMes._sum.total ?? 0);
  const receitaAnterior = Number(receitaMesAnterior._sum.total ?? 0);
  const variacaoReceita = receitaAnterior > 0 ? ((receitaAtual - receitaAnterior) / receitaAnterior) * 100 : null;

  const horaAtual = agora.getHours();
  const saudacao = horaAtual < 12 ? "Bom dia" : horaAtual < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{saudacao}, {nomeUtilizador.split(" ")[0]} 👋</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {agora.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          {!loja?.publicada && (
            <Link href="/dashboard/configuracoes"
              className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Loja não publicada — Publicar agora →
            </Link>
          )}
        </div>

        {/* Stats principais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Receita este mês",
              value: formatarPreco(receitaAtual, moeda),
              icon: "💰",
              sub: variacaoReceita !== null
                ? `${variacaoReceita >= 0 ? "+" : ""}${variacaoReceita.toFixed(0)}% vs mês anterior`
                : "Primeiro mês",
              positivo: variacaoReceita === null ? null : variacaoReceita >= 0,
              href: "/dashboard/pedidos",
            },
            {
              label: "Pedidos este mês",
              value: pedidosMes.toString(),
              icon: "📦",
              sub: `${totalPedidos} no total`,
              positivo: null,
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
              value: totalProdutos.toString(),
              icon: "🏷️",
              sub: `${totalClientes} clientes únicos`,
              positivo: null,
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
                <Link href={`/loja/${loja?.nome?.toLowerCase().replace(/\s+/g, "-")}`}
                  className="mt-3 text-xs font-bold rounded-lg px-3 py-1.5 text-white transition-colors"
                  style={{ background: cor }}>
                  Ver loja →
                </Link>
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
              </div>
              {topProdutos.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-slate-400">Sem vendas ainda</p>
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
                { label: "Clientes", href: "/dashboard/clientes", icon: "👥" },
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
