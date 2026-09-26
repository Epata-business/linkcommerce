"use client";

import { useState } from "react";

interface Props {
  totalPedidos: number;
  totalClientes: number;
  totalProdutos: number;
}

export function ExportarClient({ totalPedidos, totalClientes, totalProdutos }: Props) {
  const [desde, setDesde] = useState("");
  const [ate, setAte] = useState("");

  function buildUrl(base: string) {
    const p = new URLSearchParams();
    if (desde) p.set("desde", desde);
    if (ate) p.set("ate", ate);
    const qs = p.toString();
    return qs ? `${base}?${qs}` : base;
  }

  const exports = [
    {
      icon: "📦",
      titulo: "Pedidos",
      desc: "ID, data, cliente, produtos, total, estado, método de pagamento",
      count: totalPedidos,
      url: buildUrl("/api/exportar/pedidos"),
      sufixo: "pedidos",
      filtroData: true,
    },
    {
      icon: "👥",
      titulo: "Clientes",
      desc: "Email, nome, nº pedidos, total gasto, segmento, 1º e último pedido",
      count: totalClientes,
      url: buildUrl("/api/exportar/clientes"),
      sufixo: "clientes",
      filtroData: true,
    },
    {
      icon: "🏷️",
      titulo: "Produtos",
      desc: "ID, título, preço, stock, variantes, total vendido",
      count: totalProdutos,
      url: "/api/exportar/produtos",
      sufixo: "produtos",
      filtroData: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filtro de datas (afecta pedidos e clientes) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <p className="text-sm font-bold text-slate-700 mb-3">Filtrar por período (opcional)</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">De</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Até</label>
            <input
              type="date"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          {(desde || ate) && (
            <button
              onClick={() => { setDesde(""); setAte(""); }}
              className="text-xs text-slate-400 hover:text-slate-600 pb-2"
            >
              Limpar
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          O filtro aplica-se aos ficheiros de Pedidos e Clientes. Produtos exporta sempre a lista completa.
        </p>
      </div>

      {/* Cards de exportação */}
      <div className="space-y-3">
        {exports.map((e) => (
          <div key={e.titulo} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <span className="text-3xl flex-shrink-0">{e.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-black text-slate-800">{e.titulo}</p>
                <span className="text-xs bg-slate-100 text-slate-500 font-bold rounded-full px-2 py-0.5">
                  {e.count} {e.sufixo}
                </span>
                {e.filtroData && (desde || ate) && (
                  <span className="text-xs bg-blue-50 text-blue-600 font-bold rounded-full px-2 py-0.5">
                    Com filtro
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{e.desc}</p>
            </div>
            <a
              href={e.filtroData ? buildUrl(`/api/exportar/${e.sufixo}`) : e.url}
              download
              className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold px-4 py-2.5 transition-colors"
            >
              ↓ CSV
            </a>
          </div>
        ))}
      </div>

      {/* Nota */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
        <p className="text-xs text-blue-700 font-medium">
          💡 Os ficheiros CSV usam ponto-e-vírgula como separador e codificação UTF-8 com BOM — compatíveis com Excel (PT) e Google Sheets.
        </p>
      </div>
    </div>
  );
}
