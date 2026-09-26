"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { PERIODOS, PeriodoKey } from "@/lib/periodo";

function toIsoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function PeriodoSelector({ periodoAtual }: { periodoAtual: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const isCustom = periodoAtual === "custom";
  const hoje = toIsoDate(new Date());

  const [showPicker, setShowPicker] = useState(isCustom);
  const [inicio, setInicio] = useState(params.get("inicio") ?? toIsoDate(new Date(Date.now() - 29 * 86_400_000)));
  const [fim, setFim] = useState(params.get("fim") ?? hoje);

  useEffect(() => {
    setShowPicker(periodoAtual === "custom");
  }, [periodoAtual]);

  function navegar(periodo: string, ini?: string, fi?: string) {
    const p = new URLSearchParams(params.toString());
    p.set("periodo", periodo);
    if (periodo === "custom" && ini && fi) {
      p.set("inicio", ini);
      p.set("fim", fi);
    } else {
      p.delete("inicio");
      p.delete("fim");
    }
    router.push(`${pathname}?${p.toString()}`);
  }

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as PeriodoKey;
    if (val === "custom") {
      setShowPicker(true);
      // não navega ainda — espera que o utilizador escolha as datas
    } else {
      setShowPicker(false);
      navegar(val);
    }
  }

  function aplicarCustom() {
    if (inicio && fim && inicio <= fim) {
      navegar("custom", inicio, fim);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={periodoAtual}
        onChange={onChange}
        className="text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
      >
        {PERIODOS.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label}
          </option>
        ))}
      </select>

      {showPicker && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={inicio}
            max={fim}
            onChange={e => setInicio(e.target.value)}
            className="text-sm text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
          <span className="text-xs text-slate-400 font-medium">até</span>
          <input
            type="date"
            value={fim}
            min={inicio}
            max={hoje}
            onChange={e => setFim(e.target.value)}
            className="text-sm text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
          <button
            onClick={aplicarCustom}
            disabled={!inicio || !fim || inicio > fim}
            className="text-sm font-bold bg-slate-900 text-white rounded-xl px-3 py-2 hover:bg-slate-700 disabled:opacity-40 transition-colors"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
