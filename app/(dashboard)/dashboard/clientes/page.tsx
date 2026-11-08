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
    <div className="min-h-screen" style={{ background: "#F7F8FC" }}>
      <div className="max-w-5xl mx-auto px-5 py-7">

        {/* Header */}
        <div className="mb-6">
          <h1 className="heading-lg">Clientes</h1>
          <p className="body-sm mt-0.5">
            {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} únicos
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: "👥", label: "Total de clientes", value: clientes.length.toString() },
            { icon: "⭐", label: "VIP",               value: (contagens.vip ?? 0).toString() },
            { icon: "🔁", label: "Recorrentes",       value: (contagens.recorrente ?? 0).toString() },
            { icon: "🎯", label: "Ticket médio",      value: ticketMedio > 0 ? formatarPreco(ticketMedio, moeda) : "—" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: "1px solid hsl(220 20% 91%)", boxShadow: "0 1px 3px rgba(15,17,23,0.04)" }}>
              <div className="text-xl mb-2.5">{s.icon}</div>
              <p className="text-2xl font-bold text-[#0F1117] tabular-nums">{s.value}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs de segmento */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
          {tabs.map((tab) => {
            const ativo = filtroSegmento === tab.key;
            const count = contagens[tab.key] ?? 0;
            return (
              <Link key={tab.key}
                href={tab.key === "todos" ? "/dashboard/clientes" : `/dashboard/clientes?segmento=${tab.key}`}
                className={[
                  "flex-shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all",
                  ativo
                    ? "bg-[#0F1117] text-white"
                    : "bg-white text-[#4B5563] hover:text-[#0F1117]",
                ].join(" ")}
                style={ativo ? {} : { border: "1px solid hsl(220 20% 88%)" }}>
                <span>{tab.icon}</span>
                {tab.label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${ativo ? "bg-white/20 text-white" : "bg-[#F7F8FC] text-[#9CA3AF]"}`}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Lista */}
        {clientesFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl py-20 text-center" style={{ border: "1px solid hsl(220 20% 91%)" }}>
            <div className="text-5xl mb-4">👥</div>
            <p className="font-semibold text-[#0F1117] text-sm">
              {clientes.length === 0 ? "Ainda sem clientes" : "Nenhum cliente neste segmento"}
            </p>
            <p className="text-xs text-[#9CA3AF] mt-1">
              {clientes.length === 0
                ? "Os clientes aparecem aqui quando fizerem a primeira encomenda."
                : "Experimente outro segmento ou volte mais tarde."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid hsl(220 20% 91%)", boxShadow: "0 1px 3px rgba(15,17,23,0.04)" }}>
            {clientesFiltrados.map((c, idx) => {
              const segCfg = SEGMENTO_CONFIG[c.segmento];
              const iniciais = (c.nome ?? c.email).slice(0, 2).toUpperCase();
              return (
                <div key={c.email}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#F7F8FC]"
                  style={{ borderTop: idx > 0 ? "1px solid hsl(220 20% 95%)" : "none" }}>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${cor}, ${cor}bb)` }}>
                    {iniciais}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[#0F1117] text-sm truncate">{c.nome ?? c.email}</p>
                      <span className={`badge text-[10px] ${segCfg.bg} ${segCfg.text}`}>
                        {segCfg.icon} {segCfg.label}
                      </span>
                    </div>
                    {c.nome && <p className="text-xs text-[#9CA3AF] truncate">{c.email}</p>}
                    {c.telefone && <p className="text-xs text-[#9CA3AF]">{c.telefone}</p>}
                    <p className="text-[11px] text-[#C4C9D4] mt-0.5">
                      1.ª encomenda {c.primeiroPedido.toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}
                      {c.diasDesdeUltimo === 0 ? "última hoje" : c.diasDesdeUltimo === 1 ? "última ontem" : `última há ${c.diasDesdeUltimo} dias`}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-[#0F1117] tabular-nums">{formatarPreco(c.totalGasto, moeda)}</p>
                    <p className="text-xs text-[#9CA3AF]">{c.numPedidos} encomenda{c.numPedidos !== 1 ? "s" : ""}</p>
                    <Link href={`/dashboard/pedidos?email=${encodeURIComponent(c.email)}`}
                      className="text-[10px] text-[#153DEC] hover:text-[#1234D0] font-semibold mt-0.5 inline-block transition-colors">
                      Ver encomendas →
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
