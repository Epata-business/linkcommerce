import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { formatarPreco } from "@/lib/moeda";
import Link from "next/link";

type Segmento = "novo" | "recorrente" | "vip" | "inativo";

const SEGMENTO_CONFIG: Record<Segmento, { label: string; bg: string; text: string; icon: string }> = {
  vip:        { label: "VIP",        bg: "bg-amber-50",   text: "text-amber-700",  icon: "⭐" },
  recorrente: { label: "Recorrente", bg: "bg-blue-50",    text: "text-blue-700",   icon: "🔁" },
  novo:       { label: "Novo",       bg: "bg-green-50",   text: "text-green-700",  icon: "✨" },
  inativo:    { label: "Inativo",    bg: "bg-slate-100",  text: "text-slate-500",  icon: "💤" },
};

function computeSegmento(numPedidos: number, diasDesdeUltimo: number): Segmento {
  if (diasDesdeUltimo > 90) return "inativo";
  if (numPedidos >= 5) return "vip";
  if (numPedidos >= 2) return "recorrente";
  return "novo";
}

type ClienteRow = {
  clienteEmail: string;
  nome: string | null;
  total_pedidos: bigint;
  total_gasto: string;
  primeiro_pedido: Date;
  ultimo_pedido: Date;
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { segmento?: string };
}) {
  const lojaId = await getLojaId();
  const filtroSegmento = (searchParams.segmento ?? "todos") as Segmento | "todos";

  const [loja, clientesRaw, clientesRegistados] = await Promise.all([
    prisma.loja.findUnique({ where: { id: lojaId }, select: { moeda: true, corPrimaria: true } }),

    // Todos os clientes únicos derivados de pedidos
    prisma.$queryRaw<ClienteRow[]>`
      SELECT
        "clienteEmail",
        MAX("clienteNome") AS nome,
        COUNT(*)::bigint AS total_pedidos,
        SUM(total)::text AS total_gasto,
        MIN("createdAt") AS primeiro_pedido,
        MAX("createdAt") AS ultimo_pedido
      FROM pedidos
      WHERE "lojaId" = ${lojaId} AND status != 'CANCELLED'
      GROUP BY "clienteEmail"
      ORDER BY MAX("createdAt") DESC
    `,

    // Clientes com conta (para telefone)
    prisma.cliente.findMany({
      where: { lojaId },
      select: { email: true, telefone: true },
    }),
  ]);

  const moeda = loja?.moeda ?? "EUR";
  const cor = loja?.corPrimaria ?? "#153DFC";
  const telefoneMap = new Map(clientesRegistados.map(c => [c.email, c.telefone]));
  const agora = Date.now();

  // Enriquecer com segmento
  const clientes = clientesRaw.map((c) => {
    const diasDesdeUltimo = Math.floor((agora - new Date(c.ultimo_pedido).getTime()) / 86_400_000);
    const numPedidos = Number(c.total_pedidos);
    const segmento = computeSegmento(numPedidos, diasDesdeUltimo);
    return {
      email: c.clienteEmail,
      nome: c.nome ?? null,
      numPedidos,
      totalGasto: parseFloat(c.total_gasto ?? "0"),
      primeiroPedido: new Date(c.primeiro_pedido),
      ultimoPedido: new Date(c.ultimo_pedido),
      diasDesdeUltimo,
      telefone: telefoneMap.get(c.clienteEmail) ?? null,
      segmento,
    };
  });

  // Contagens por segmento
  const contagens: Record<string, number> = { todos: clientes.length };
  for (const c of clientes) contagens[c.segmento] = (contagens[c.segmento] ?? 0) + 1;

  // Filtrar
  const clientesFiltrados = filtroSegmento === "todos"
    ? clientes
    : clientes.filter(c => c.segmento === filtroSegmento);

  const tabs: { key: string; label: string; icon: string }[] = [
    { key: "todos",       label: "Todos",       icon: "👥" },
    { key: "vip",         label: "VIP",         icon: "⭐" },
    { key: "recorrente",  label: "Recorrentes", icon: "🔁" },
    { key: "novo",        label: "Novos",       icon: "✨" },
    { key: "inativo",     label: "Inativos",    icon: "💤" },
  ];

  const totalReceita = clientes.reduce((s, c) => s + c.totalGasto, 0);
  const ticketMedio = clientes.length > 0
    ? totalReceita / clientes.reduce((s, c) => s + c.numPedidos, 0)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900">Clientes</h1>
          <p className="text-slate-400 text-sm mt-1">
            {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} únicos
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: "👥", label: "Total clientes",   value: clientes.length.toString() },
            { icon: "⭐", label: "VIP",              value: (contagens.vip ?? 0).toString() },
            { icon: "🔁", label: "Recorrentes",      value: (contagens.recorrente ?? 0).toString() },
            { icon: "🎯", label: "Ticket médio",     value: ticketMedio > 0 ? formatarPreco(ticketMedio, moeda) : "—" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-xl font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs de segmento */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {tabs.map((tab) => {
            const ativo = filtroSegmento === tab.key;
            const count = contagens[tab.key] ?? 0;
            return (
              <Link key={tab.key}
                href={tab.key === "todos" ? "/dashboard/clientes" : `/dashboard/clientes?segmento=${tab.key}`}
                className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all
                  ${ativo ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"}`}>
                <span>{tab.icon}</span>
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

        {/* Lista */}
        {clientesFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
            <div className="text-5xl mb-4">👥</div>
            <p className="font-bold text-slate-700">
              {clientes.length === 0 ? "Ainda sem clientes" : "Nenhum cliente neste segmento"}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {clientes.length === 0
                ? "Os clientes aparecem aqui quando fizerem o primeiro pedido."
                : "Experimenta outro segmento ou volta mais tarde."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {clientesFiltrados.map((c) => {
              const segCfg = SEGMENTO_CONFIG[c.segmento];
              const iniciais = (c.nome ?? c.email).slice(0, 2).toUpperCase();
              return (
                <div key={c.email}
                  className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                    style={{ background: `linear-gradient(135deg,${cor},${cor}99)` }}>
                    {iniciais}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800 truncate">
                        {c.nome ?? c.email}
                      </p>
                      <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 flex-shrink-0 ${segCfg.bg} ${segCfg.text}`}>
                        {segCfg.icon} {segCfg.label}
                      </span>
                    </div>
                    {c.nome && (
                      <p className="text-xs text-slate-400 truncate">{c.email}</p>
                    )}
                    {c.telefone && (
                      <p className="text-xs text-slate-400">{c.telefone}</p>
                    )}
                    <p className="text-xs text-slate-300 mt-1">
                      1º pedido {c.primeiroPedido.toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}
                      {c.diasDesdeUltimo === 0
                        ? "último pedido hoje"
                        : c.diasDesdeUltimo === 1
                        ? "último pedido ontem"
                        : `último pedido há ${c.diasDesdeUltimo} dias`}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-black text-slate-900">{formatarPreco(c.totalGasto, moeda)}</p>
                    <p className="text-xs text-slate-400">{c.numPedidos} pedido{c.numPedidos !== 1 ? "s" : ""}</p>
                    <Link href={`/dashboard/pedidos?email=${encodeURIComponent(c.email)}`}
                      className="text-[10px] text-blue-500 hover:text-blue-700 font-medium mt-0.5 inline-block">
                      Ver pedidos →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
