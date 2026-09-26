"use client";

import { useState } from "react";
import { formatarPreco } from "@/lib/moeda";

interface Props {
  diasDoIntervalo: { label: string; receita: number; pedidos: number }[];
  receitaMeses: { label: string; receita: number; pedidos: number }[];
  topProdutos: { titulo: string; quantidade: number }[];
  pedidosPorStatus: { status: string; count: number }[];
  pedidosPorCanal: { canal: string; count: number }[];
  pagamentosPorMetodo: { metodo: string; count: number }[];
  moeda: string;
  cor: string;
  labelPeriodo: string;
}

const STATUS_CORES: Record<string, string> = {
  "Pendente": "#f59e0b",
  "Em processamento": "#3b82f6",
  "Enviado": "#8b5cf6",
  "Entregue": "#10b981",
  "Cancelado": "#ef4444",
};

function LineChart({
  dados,
  moeda,
  cor,
}: {
  dados: { label: string; receita: number; pedidos: number }[];
  moeda: string;
  cor: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const W = 800;
  const H = 200;
  const PAD = { top: 24, right: 16, bottom: 36, left: 16 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxR = Math.max(...dados.map(d => d.receita), 1);

  // Skip labels to avoid crowding
  const skipFactor = dados.length > 30 ? 7 : dados.length > 14 ? 3 : 1;

  const points = dados.map((d, i) => ({
    x: PAD.left + (dados.length === 1 ? innerW / 2 : (i / (dados.length - 1)) * innerW),
    y: PAD.top + innerH - (d.receita / maxR) * innerH,
    ...d,
  }));

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${PAD.top + innerH} L ${points[0].x} ${PAD.top + innerH} Z`;

  const gradientId = `grad-${cor.replace("#", "")}`;

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: "300px" }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={cor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PAD.top + frac * innerH;
          return (
            <line key={frac} x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke="#e2e8f0" strokeWidth="1" />
          );
        })}

        {/* Area fill */}
        {points.length > 1 && (
          <path d={areaD} fill={`url(#${gradientId})`} />
        )}

        {/* Line */}
        {points.length > 1 && (
          <path d={pathD} fill="none" stroke={cor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        )}

        {/* Hover line */}
        {hoverIdx !== null && points[hoverIdx] && (
          <line
            x1={points[hoverIdx].x} y1={PAD.top}
            x2={points[hoverIdx].x} y2={PAD.top + innerH}
            stroke={cor} strokeWidth="1" strokeDasharray="4 2" opacity="0.5"
          />
        )}

        {/* Dots + hover zones */}
        {points.map((p, i) => (
          <g key={i}>
            <rect
              x={i === 0 ? p.x : (points[i - 1].x + p.x) / 2}
              y={PAD.top}
              width={i === 0 ? (points[1]?.x ?? p.x) - p.x : p.x - (points[i - 1].x + p.x) / 2}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              style={{ cursor: "crosshair" }}
            />
            <circle
              cx={p.x} cy={p.y} r={hoverIdx === i ? 5 : 3}
              fill={hoverIdx === i ? cor : "white"}
              stroke={cor}
              strokeWidth="2"
              style={{ transition: "r 0.1s" }}
            />
          </g>
        ))}

        {/* X labels (sampled) */}
        {points.map((p, i) => i % skipFactor === 0 && (
          <text key={i} x={p.x} y={H - 4} textAnchor="middle"
            fontSize="10" fill="#94a3b8" fontFamily="inherit">
            {p.label}
          </text>
        ))}

        {/* Tooltip */}
        {hoverIdx !== null && points[hoverIdx] && (() => {
          const p = points[hoverIdx];
          const bw = 130;
          const bh = 44;
          const bx = Math.min(Math.max(p.x - bw / 2, PAD.left), W - PAD.right - bw);
          const by = p.y - bh - 8 < PAD.top ? p.y + 8 : p.y - bh - 8;
          return (
            <g>
              <rect x={bx} y={by} width={bw} height={bh} rx="8" fill="#0f172a" opacity="0.92" />
              <text x={bx + 10} y={by + 16} fontSize="10" fill="#94a3b8" fontFamily="inherit">
                {p.label}
              </text>
              <text x={bx + 10} y={by + 33} fontSize="13" fontWeight="700" fill="white" fontFamily="inherit">
                {formatarPreco(p.receita, moeda)}
              </text>
              <text x={bx + bw - 10} y={by + 33} fontSize="11" fill="#64748b" textAnchor="end" fontFamily="inherit">
                {p.pedidos} ped.
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

function BarChart({
  dados,
  moeda,
  cor,
}: {
  dados: { label: string; receita: number; pedidos: number }[];
  moeda: string;
  cor: string;
}) {
  const maxR = Math.max(...dados.map(m => m.receita), 1);
  return (
    <div className="flex items-end gap-2 h-36">
      {dados.map((m) => {
        const altura = maxR > 0 ? (m.receita / maxR) * 100 : 0;
        return (
          <div key={m.label} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full flex flex-col items-center justify-end h-28">
              {m.receita > 0 && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {formatarPreco(m.receita, moeda)}
                </div>
              )}
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${Math.max(altura, m.receita > 0 ? 4 : 0)}%`,
                  background: `linear-gradient(to top, ${cor}, ${cor}88)`,
                  minHeight: m.receita > 0 ? "6px" : "0",
                }}
              />
              {m.receita === 0 && <div className="w-full h-0.5 rounded bg-slate-100" />}
            </div>
            <p className="text-[9px] font-semibold text-slate-400">{m.label}</p>
          </div>
        );
      })}
    </div>
  );
}

export function RelatoriosClient({
  diasDoIntervalo,
  receitaMeses,
  topProdutos,
  pedidosPorStatus,
  pedidosPorCanal,
  pagamentosPorMetodo,
  moeda,
  cor,
  labelPeriodo,
}: Props) {
  const totalStatus = pedidosPorStatus.reduce((s, p) => s + p.count, 0);
  const totalCanal = pedidosPorCanal.reduce((s, c) => s + c.count, 0);

  return (
    <div className="space-y-6">
      {/* Gráfico de linha — receita por dia no período */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 mb-1">
          Receita por dia — {labelPeriodo}
        </h2>
        <p className="text-xs text-slate-400 mb-4">Passe o rato para ver o detalhe de cada dia</p>
        {diasDoIntervalo.every(d => d.receita === 0) ? (
          <div className="h-36 flex items-center justify-center">
            <p className="text-sm text-slate-400">Sem receita no período selecionado</p>
          </div>
        ) : (
          <LineChart dados={diasDoIntervalo} moeda={moeda} cor={cor} />
        )}
      </div>

      {/* Gráfico de barras — últimos 12 meses */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 mb-6">Receita — últimos 12 meses</h2>
        <BarChart dados={receitaMeses} moeda={moeda} cor={cor} />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Pedidos por estado */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Pedidos por estado</h2>
          {pedidosPorStatus.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Ainda sem pedidos</p>
          ) : (
            <div className="space-y-3">
              {pedidosPorStatus.map((s) => {
                const pct = totalStatus > 0 ? (s.count / totalStatus) * 100 : 0;
                return (
                  <div key={s.status}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: STATUS_CORES[s.status] ?? "#94a3b8" }} />
                        <span className="text-xs font-medium text-slate-700">{s.status}</span>
                      </div>
                      <span className="text-xs font-black text-slate-900">{s.count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: STATUS_CORES[s.status] ?? "#94a3b8" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
                  <p className="flex-1 text-sm font-medium text-slate-800 truncate">{p.titulo}</p>
                  <span className="text-sm font-black text-slate-500 flex-shrink-0">{p.quantidade} un.</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Canal de vendas */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Canal de vendas</h2>
          {pedidosPorCanal.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Ainda sem pedidos</p>
          ) : (
            <div className="space-y-3">
              {pedidosPorCanal.map((c) => {
                const pct = totalCanal > 0 ? (c.count / totalCanal) * 100 : 0;
                const canalLabel = c.canal === "ONLINE" ? "Online" : c.canal === "POS" ? "POS / Loja" : c.canal;
                const canalCor = c.canal === "ONLINE" ? "#3b82f6" : "#8b5cf6";
                return (
                  <div key={c.canal}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-700">{canalLabel}</span>
                      <span className="text-xs font-black text-slate-900">{c.count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: canalCor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Métodos de pagamento */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Métodos de pagamento</h2>
          {pagamentosPorMetodo.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Sem pagamentos no período</p>
          ) : (
            <div className="space-y-3">
              {pagamentosPorMetodo
                .sort((a, b) => b.count - a.count)
                .map((p) => {
                  const total = pagamentosPorMetodo.reduce((s, x) => s + x.count, 0);
                  const pct = total > 0 ? (p.count / total) * 100 : 0;
                  return (
                    <div key={p.metodo}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700">{p.metodo}</span>
                        <span className="text-xs font-black text-slate-900">{p.count} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-slate-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
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
