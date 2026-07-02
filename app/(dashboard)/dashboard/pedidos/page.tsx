import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { formatarPreco } from "@/lib/moeda";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  PENDING:    { label: "Pendente",          dot: "bg-yellow-400", bg: "bg-yellow-50",  text: "text-yellow-700" },
  PROCESSING: { label: "Em processamento",  dot: "bg-blue-400",   bg: "bg-blue-50",    text: "text-blue-700"   },
  SHIPPED:    { label: "Enviado",           dot: "bg-purple-400", bg: "bg-purple-50",  text: "text-purple-700" },
  DELIVERED:  { label: "Entregue",          dot: "bg-green-400",  bg: "bg-green-50",   text: "text-green-700"  },
  CANCELLED:  { label: "Cancelado",         dot: "bg-red-400",    bg: "bg-red-50",     text: "text-red-700"    },
};

const CANAL_LABEL: Record<string, string> = { ONLINE: "Online", POS: "POS" };

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const lojaId = await getLojaId();
  const filtroStatus = searchParams.status?.toUpperCase();

  const [loja, pedidos] = await Promise.all([
    prisma.loja.findUnique({ where: { id: lojaId }, select: { moeda: true } }),
    prisma.pedido.findMany({
      where: {
        lojaId,
        ...(filtroStatus && filtroStatus !== "TODOS" ? { status: filtroStatus as never } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        itens: {
          include: { produto: { select: { titulo: true, imagemUrl: true } } },
          take: 3,
        },
      },
    }),
  ]);

  const moeda = loja?.moeda ?? "EUR";

  // Contagem por status para os tabs
  const todos = await prisma.pedido.count({ where: { lojaId } });
  const contagens = await prisma.pedido.groupBy({
    by: ["status"],
    where: { lojaId },
    _count: true,
  });
  const contagemMap: Record<string, number> = { TODOS: todos };
  for (const c of contagens) contagemMap[c.status] = c._count;

  // Totais do mês
  const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
  const totalMes = await prisma.pedido.aggregate({
    where: { lojaId, createdAt: { gte: inicioMes }, status: { not: "CANCELLED" } },
    _sum: { total: true },
    _count: true,
  });

  const tabs = [
    { key: "TODOS", label: "Todos" },
    { key: "PENDING", label: "Pendentes" },
    { key: "PROCESSING", label: "Em processo" },
    { key: "SHIPPED", label: "Enviados" },
    { key: "DELIVERED", label: "Entregues" },
    { key: "CANCELLED", label: "Cancelados" },
  ];

  const tabAtivo = filtroStatus ?? "TODOS";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900">Pedidos</h1>
          <p className="text-slate-400 text-sm mt-1">{todos} pedido{todos !== 1 ? "s" : ""} no total</p>
        </div>

        {/* Stats do mês */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Receita este mês", value: formatarPreco(Number(totalMes._sum.total ?? 0), moeda), icon: "💰" },
            { label: "Pedidos este mês", value: totalMes._count.toString(), icon: "📦" },
            { label: "Pendentes agora", value: (contagemMap["PENDING"] ?? 0).toString(), icon: "⏳" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs de filtro */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {tabs.map((tab) => {
            const ativo = tabAtivo === tab.key;
            const count = contagemMap[tab.key] ?? 0;
            return (
              <Link key={tab.key}
                href={tab.key === "TODOS" ? "/dashboard/pedidos" : `/dashboard/pedidos?status=${tab.key.toLowerCase()}`}
                className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all
                  ${ativo ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"}`}>
                {tab.label}
                {count > 0 && (
                  <span className={`text-[11px] font-black rounded-full px-1.5 py-0.5
                    ${ativo ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Lista de pedidos */}
        {pedidos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="font-bold text-slate-700">Nenhum pedido encontrado</p>
            <p className="text-sm text-slate-400 mt-1">
              {tabAtivo === "TODOS" ? "Quando os clientes fizerem pedidos aparecem aqui." : `Não há pedidos com o estado "${STATUS_CONFIG[tabAtivo]?.label ?? tabAtivo}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pedidos.map((pedido) => {
              const cfg = STATUS_CONFIG[pedido.status] ?? STATUS_CONFIG.PENDING;
              const moradaJson = (pedido.morada as Record<string, unknown>) ?? {};
              const tracking = moradaJson.tracking as string | undefined;

              return (
                <Link key={pedido.id} href={`/dashboard/pedidos/${pedido.id}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group">

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-400">#{pedido.id.slice(-8).toUpperCase()}</span>
                      <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 font-medium">
                        {CANAL_LABEL[pedido.channel] ?? pedido.channel}
                      </span>
                    </div>

                    <p className="mt-1.5 text-sm font-semibold text-slate-800 truncate">{pedido.clienteNome ?? pedido.clienteEmail}</p>
                    <p className="text-xs text-slate-400 truncate">{pedido.clienteEmail}</p>

                    {/* Prévia dos itens */}
                    <p className="mt-2 text-xs text-slate-500">
                      {pedido.itens.slice(0, 2).map(i => i.produto?.titulo ?? "Produto").join(" · ")}
                      {pedido.itens.length > 2 && ` +${pedido.itens.length - 2}`}
                    </p>

                    {tracking && (
                      <p className="mt-1 text-xs text-purple-600 font-medium">📦 Tracking: {tracking}</p>
                    )}
                  </div>

                  {/* Total + data */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 flex-shrink-0">
                    <p className="text-lg font-black text-slate-900">{formatarPreco(Number(pedido.total), moeda)}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(pedido.createdAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    <span className="text-slate-300 group-hover:text-slate-500 transition-colors text-lg hidden sm:block">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
