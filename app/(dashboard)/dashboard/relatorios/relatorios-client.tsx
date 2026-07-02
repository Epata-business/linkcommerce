"use client";

import { formatarPreco } from "@/lib/moeda";

interface Props {
  dadosMeses: { label: string; receita: number; pedidos: number }[];
  topProdutos: { titulo: string; quantidade: number }[];
  pedidosPorStatus: { status: string; count: number }[];
  moeda: string;
  cor: string;
}

export function RelatoriosClient({ dadosMeses, topProdutos, pedidosPorStatus, moeda, cor }: Props) {
  const maxReceita = Math.max(...dadosMeses.map(m => m.receita), 1);

  const statusCores: Record<string, string> = {
    "Pendente": "#f59e0b",
    "Em processamento": "#3b82f6",
    "Enviado": "#8b5cf6",
    "Entregue": "#10b981",
    "Cancelado": "#ef4444",
  };

  return (
    <div className="space-y-6">
      {/* Gráfico de barras — receita por mês */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 mb-6">Receita dos últimos 6 meses</h2>
        <div className="flex items-end gap-3 h-48">
          {dadosMeses.map((m) => {
            const altura = maxReceita > 0 ? (m.receita / maxReceita) * 100 : 0;
            return (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="relative w-full flex flex-col items-center justify-end h-36">
                  {m.receita > 0 && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {formatarPreco(m.receita, moeda)}
                    </div>
                  )}
                  <div
                    className="w-full rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${Math.max(altura, m.receita > 0 ? 4 : 0)}%`,
                      background: `linear-gradient(to top, ${cor}, ${cor}88)`,
                      minHeight: m.receita > 0 ? "8px" : "0",
                    }}
                  />
                  {m.receita === 0 && (
                    <div className="w-full h-1 rounded bg-slate-100" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold text-slate-500">{m.label}</p>
                  <p className="text-[10px] text-slate-400">{m.pedidos} ped.</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Top produtos */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Produtos mais vendidos</h2>
          {topProdutos.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Ainda sem vendas</p>
          ) : (
            <div className="space-y-3">
              {topProdutos.map((p, i) => (
                <div key={p.titulo} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                    style={{ background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : "#d97706" }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.titulo}</p>
                  </div>
                  <span className="text-sm font-black text-slate-500 flex-shrink-0">{p.quantidade} un.</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pedidos por estado */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Pedidos por estado</h2>
          {pedidosPorStatus.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Ainda sem pedidos</p>
          ) : (
            <div className="space-y-3">
              {pedidosPorStatus.map((s) => (
                <div key={s.status} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: statusCores[s.status] ?? "#94a3b8" }} />
                  <div className="flex-1 text-sm text-slate-700">{s.status}</div>
                  <span className="text-sm font-black text-slate-900">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Exportar com datas */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Exportar pedidos por período</h2>
        <ExportarForm cor={cor} />
      </div>
    </div>
  );
}

function ExportarForm({ cor }: { cor: string }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const desde = fd.get("desde") as string;
        const ate = fd.get("ate") as string;
        const params = new URLSearchParams();
        if (desde) params.set("desde", desde);
        if (ate) params.set("ate", ate);
        window.location.href = `/api/exportar/pedidos?${params}`;
      }}
      className="flex flex-wrap gap-3 items-end"
    >
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">De</label>
        <input type="date" name="desde"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Até</label>
        <input type="date" name="ate"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
      </div>
      <button type="submit"
        className="rounded-xl px-4 py-2 text-sm font-bold text-white hover:opacity-90 transition-all"
        style={{ background: `linear-gradient(135deg, ${cor}, ${cor}bb)` }}>
        ⬇️ Exportar CSV
      </button>
    </form>
  );
}
