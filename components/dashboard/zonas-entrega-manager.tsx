"use client";

import { useState } from "react";

interface Zona {
  id: string;
  nome: string;
  preco: number | string;
  prazo: string | null;
  ativo: boolean;
}

export function ZonasEntregaManager({ zonas: inicial, moeda }: { zonas: Zona[]; moeda: string }) {
  const [zonas, setZonas] = useState<Zona[]>(inicial);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [prazo, setPrazo] = useState("");
  const [loading, setLoading] = useState(false);

  const sym = moeda === "AOA" ? "Kz" : moeda === "USD" ? "$" : "€";

  const SUGESTOES = [
    { nome: "Luanda Centro", prazo: "Mesmo dia" },
    { nome: "Talatona", prazo: "1-2 dias" },
    { nome: "Viana", prazo: "1-2 dias" },
    { nome: "Kilamba", prazo: "1-2 dias" },
    { nome: "Cacuaco", prazo: "2-3 dias" },
    { nome: "Bengo", prazo: "3-5 dias" },
    { nome: "Huambo", prazo: "3-5 dias" },
    { nome: "Todo o País", prazo: "5-7 dias" },
  ];

  async function adicionar() {
    if (!nome || !preco) return;
    setLoading(true);
    const res = await fetch("/api/zonas-entrega", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, preco: parseFloat(preco), prazo: prazo || null }),
    });
    const nova = await res.json();
    setZonas((z) => [...z, nova]);
    setNome(""); setPreco(""); setPrazo("");
    setLoading(false);
  }

  async function remover(id: string) {
    await fetch("/api/zonas-entrega", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setZonas((z) => z.filter((z) => z.id !== id));
  }

  return (
    <div className="space-y-5">
      {/* Sugestões rápidas */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Sugestões rápidas Angola</h3>
        <div className="flex flex-wrap gap-2">
          {SUGESTOES.map((s) => (
            <button key={s.nome}
              onClick={() => { setNome(s.nome); setPrazo(s.prazo); }}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
              {s.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Formulário */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Adicionar zona</h3>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Zona / Bairro</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Talatona"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Preço ({sym})</label>
            <input type="number" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Prazo (opcional)</label>
            <input value={prazo} onChange={(e) => setPrazo(e.target.value)} placeholder="Ex: 1-2 dias"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" />
          </div>
        </div>
        <button onClick={adicionar} disabled={loading || !nome || !preco}
          className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {loading ? "A adicionar…" : "+ Adicionar zona"}
        </button>
      </div>

      {/* Lista */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Zonas configuradas</h3>
        {zonas.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Ainda não há zonas de entrega configuradas.</p>
        ) : (
          <div className="space-y-2">
            {zonas.map((z) => (
              <div key={z.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{z.nome}</p>
                  {z.prazo && <p className="text-xs text-slate-400">{z.prazo}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-indigo-600">
                    {moeda === "AOA"
                      ? `${Number(z.preco).toLocaleString("pt-AO")} Kz`
                      : `${sym}${Number(z.preco).toFixed(2)}`}
                  </span>
                  <button onClick={() => remover(z.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors text-lg leading-none">×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
