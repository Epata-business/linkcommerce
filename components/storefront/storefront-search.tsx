"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface Produto {
  id: string;
  titulo: string;
  descricao: string | null;
  preco: number;
  imagemUrl: string | null;
  stock: number;
}

interface Props {
  produtos: Produto[];
  corPrimaria: string;
  initialQuery?: string;
  onFilter: (filtered: Produto[]) => void;
}

export function StorefrontSearch({ produtos, corPrimaria, initialQuery = "", onFilter }: Props) {
  const [q, setQ] = useState(initialQuery);
  const [apenasStock, setApenasStock] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  useEffect(() => {
    const lower = q.trim().toLowerCase();
    let filtered = produtos;

    if (lower) {
      filtered = filtered.filter(
        (p) =>
          p.titulo.toLowerCase().includes(lower) ||
          (p.descricao?.toLowerCase().includes(lower) ?? false)
      );
    }

    if (apenasStock) {
      filtered = filtered.filter((p) => p.stock > 0);
    }

    onFilter(filtered);

    // Sincronizar ?q= na URL sem recarregar página
    const params = new URLSearchParams(searchParams.toString());
    if (lower) {
      params.set("q", lower);
    } else {
      params.delete("q");
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, apenasStock, produtos]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-8">
      {/* Search input */}
      <div className="relative flex-1">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pesquisar produtos…"
          className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 shadow-sm transition-shadow"
          style={{ "--tw-ring-color": `${corPrimaria}40` } as React.CSSProperties}
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 transition-colors text-xs font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Stock filter */}
      <button
        onClick={() => setApenasStock((v) => !v)}
        className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all shadow-sm ${
          apenasStock
            ? "text-white border-transparent"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
        }`}
        style={apenasStock ? { background: corPrimaria, borderColor: corPrimaria } : {}}
      >
        <span className={`w-2 h-2 rounded-full ${apenasStock ? "bg-white" : "bg-green-400"}`} />
        Em stock
      </button>
    </div>
  );
}
