"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type ResultadoPedido = {
  id: string;
  clienteNome: string | null;
  clienteEmail: string;
  status: string;
  total: number;
};

type ResultadoProduto = {
  id: string;
  titulo: string;
  preco: number;
  stock: number;
  ativo: boolean;
};

type ResultadoCliente = {
  id: string;
  email: string;
  nome: string | null;
};

type Resultados = {
  pedidos: ResultadoPedido[];
  produtos: ResultadoProduto[];
  clientes: ResultadoCliente[];
};

const STATUS_CORES: Record<string, string> = {
  PENDING:    "text-amber-600",
  PROCESSING: "text-blue-600",
  SHIPPED:    "text-indigo-600",
  DELIVERED:  "text-green-600",
  CANCELLED:  "text-red-500",
  RETURNED:   "text-slate-500",
};

export function PesquisaGlobal() {
  const router = useRouter();
  const [aberta, setAberta] = useState(false);
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Resultados | null>(null);
  const [carregando, setCarregando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cmd/Ctrl+K para abrir
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setAberta(a => !a);
      }
      if (e.key === "Escape") setAberta(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (aberta) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQuery(""); setResultados(null); }
  }, [aberta]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setAberta(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pesquisar = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.length < 2) { setResultados(null); return; }
    timerRef.current = setTimeout(async () => {
      setCarregando(true);
      try {
        const res = await fetch(`/api/pesquisa?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResultados(data);
      } finally {
        setCarregando(false);
      }
    }, 280);
  }, []);

  const totalResultados = resultados
    ? resultados.pedidos.length + resultados.produtos.length + resultados.clientes.length
    : 0;

  const navegar = (href: string) => {
    router.push(href);
    setAberta(false);
  };

  return (
    <>
      {/* Botão de trigger na sidebar */}
      <button
        onClick={() => setAberta(true)}
        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="flex-1 text-left">Pesquisar</span>
        <kbd className="hidden sm:inline text-[10px] bg-slate-700 text-slate-400 rounded px-1.5 py-0.5">⌘K</kbd>
      </button>

      {/* Modal de pesquisa */}
      {aberta && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAberta(false)} />
          <div ref={wrapperRef} className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">

            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-400 shrink-0">
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); pesquisar(e.target.value); }}
                placeholder="Pesquisar pedidos, produtos, clientes…"
                className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent outline-none"
              />
              {carregando && (
                <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
              )}
              <kbd
                onClick={() => setAberta(false)}
                className="cursor-pointer text-[10px] bg-slate-100 text-slate-400 rounded px-1.5 py-0.5 hover:bg-slate-200"
              >
                Esc
              </kbd>
            </div>

            {/* Resultados */}
            <div className="max-h-[420px] overflow-y-auto">
              {query.length < 2 && (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  Escreve pelo menos 2 caracteres
                </div>
              )}

              {query.length >= 2 && !carregando && resultados && totalResultados === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  Nenhum resultado para "<strong>{query}</strong>"
                </div>
              )}

              {resultados && resultados.pedidos.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                    Pedidos
                  </div>
                  {resultados.pedidos.map(p => (
                    <button
                      key={p.id}
                      onClick={() => navegar(`/dashboard/pedidos/${p.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                        #
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {p.clienteNome ?? p.clienteEmail}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{p.id.slice(-8).toUpperCase()}</p>
                      </div>
                      <span className={`text-xs font-medium ${STATUS_CORES[p.status] ?? "text-slate-500"}`}>
                        {p.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {resultados && resultados.produtos.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                    Produtos
                  </div>
                  {resultados.produtos.map(p => (
                    <button
                      key={p.id}
                      onClick={() => navegar(`/dashboard/produtos`)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${p.ativo ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                        P
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{p.titulo}</p>
                        <p className="text-xs text-slate-400">Stock: {p.stock}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-700 tabular-nums">
                        {Number(p.preco).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {resultados && resultados.clientes.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                    Clientes
                  </div>
                  {resultados.clientes.map(c => (
                    <button
                      key={c.id}
                      onClick={() => navegar(`/dashboard/clientes`)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-500 shrink-0 uppercase">
                        {(c.nome ?? c.email).charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{c.nome ?? c.email}</p>
                        {c.nome && <p className="text-xs text-slate-400 truncate">{c.email}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
