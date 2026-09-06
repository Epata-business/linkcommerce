"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Pendente {
  id: string;
  loja: string;
  subdominio: string;
  plano: string;
  precoMensal: number;
  comprovanteUrl: string;
  atualizadoEm: string;
}

export function SubscricoesAdmin({ pendentes }: { pendentes: Pendente[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function agir(id: string, acao: "aprovar" | "rejeitar") {
    setLoading(id + acao);
    try {
      await fetch(`/api/admin/subscricao/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao }),
      });
      router.refresh();
    } catch {
      alert("Erro ao processar acção.");
    }
    setLoading(null);
  }

  return (
    <div className="space-y-4">
      {pendentes.map((s) => (
        <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-bold text-slate-900">{s.loja}</p>
              <p className="text-sm text-slate-400">{s.subdominio}.linkcommerce.cc · Plano {s.plano} · €{s.precoMensal}/mês</p>
              <p className="text-xs text-slate-300 mt-1">Submetido em {new Date(s.atualizadoEm).toLocaleString("pt-PT")}</p>
            </div>
            <div className="flex gap-2">
              <a
                href={s.comprovanteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Ver comprovativo ↗
              </a>
              <button
                onClick={() => agir(s.id, "rejeitar")}
                disabled={loading !== null}
                className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
                {loading === s.id + "rejeitar" ? "…" : "Rejeitar"}
              </button>
              <button
                onClick={() => agir(s.id, "aprovar")}
                disabled={loading !== null}
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
                {loading === s.id + "aprovar" ? "…" : "Aprovar ✓"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
