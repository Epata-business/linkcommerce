"use client";

import { useState } from "react";

interface Avaliacao {
  id: string;
  clienteNome: string | null;
  estrelas: number;
  comentario: string | null;
  criadaEm: string;
}

interface Props {
  lojaId: string;
  produtoId: string;
  pedidoId?: string;
  avaliacoes: Avaliacao[];
  mediaEstrelas: number;
  totalAvaliacoes: number;
  cor: string;
}

function Estrelas({ valor, max = 5, tamanho = "md" }: { valor: number; max?: number; tamanho?: "sm" | "md" | "lg" }) {
  const sz = tamanho === "sm" ? "text-sm" : tamanho === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className={`flex gap-0.5 ${sz}`} aria-label={`${valor} de ${max} estrelas`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ color: i < valor ? "#f59e0b" : "#e2e8f0" }}>★</span>
      ))}
    </div>
  );
}

function FormAvaliacao({
  lojaId, produtoId, pedidoId, cor, onSubmetida,
}: {
  lojaId: string; produtoId: string; pedidoId?: string; cor: string;
  onSubmetida: () => void;
}) {
  const [estrelas, setEstrelas] = useState(0);
  const [hover, setHover] = useState(0);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (estrelas === 0) { setErro("Selecione uma classificação."); return; }
    if (!email) { setErro("O email é obrigatório."); return; }
    setLoading(true);
    setErro("");
    try {
      const res = await fetch("/api/avaliar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lojaId, produtoId, pedidoId, clienteEmail: email, clienteNome: nome || undefined, estrelas, comentario: comentario || undefined }),
      });
      if (res.ok) {
        onSubmetida();
      } else {
        const data = await res.json();
        setErro(data.erro ?? "Erro ao submeter. Tente novamente.");
      }
    } catch {
      setErro("Erro de ligação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 rounded-2xl p-5 space-y-4 border border-slate-100">
      <h3 className="font-bold text-slate-900 text-sm">Escrever avaliação</h3>

      {/* Estrelas interactivas */}
      <div>
        <p className="text-xs text-slate-500 mb-2">Classificação *</p>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover(i + 1)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setEstrelas(i + 1)}
              className="text-2xl transition-transform hover:scale-110"
              style={{ color: (hover || estrelas) > i ? "#f59e0b" : "#e2e8f0" }}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Nome (opcional)</label>
          <input value={nome} onChange={e => setNome(e.target.value)} maxLength={100}
            placeholder="O seu nome"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Email *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="o-seu@email.com"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">Comentário (opcional)</label>
        <textarea value={comentario} onChange={e => setComentario(e.target.value)} maxLength={1000} rows={3}
          placeholder="Partilhe a sua experiência com este produto…"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100" />
      </div>

      {erro && <p className="text-xs text-red-500 font-medium">{erro}</p>}

      <button type="submit" disabled={loading}
        className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: cor }}>
        {loading ? "A submeter…" : "Submeter avaliação"}
      </button>
    </form>
  );
}

export function AvaliacoesSection({ lojaId, produtoId, pedidoId, avaliacoes, mediaEstrelas, totalAvaliacoes, cor }: Props) {
  const [submetida, setSubmetida] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const distribuicao = [5, 4, 3, 2, 1].map(n => ({
    estrelas: n,
    count: avaliacoes.filter(a => a.estrelas === n).length,
  }));

  return (
    <section className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-100">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Avaliações</h2>
          {totalAvaliacoes > 0 ? (
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black text-slate-900">{mediaEstrelas.toFixed(1)}</span>
              <div>
                <Estrelas valor={Math.round(mediaEstrelas)} tamanho="lg" />
                <p className="text-xs text-slate-400 mt-0.5">{totalAvaliacoes} avaliação{totalAvaliacoes !== 1 ? "ões" : ""}</p>
              </div>
              {/* Distribuição */}
              <div className="ml-4 space-y-1 hidden sm:block">
                {distribuicao.map(d => (
                  <div key={d.estrelas} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-3">{d.estrelas}</span>
                    <span className="text-xs text-amber-400">★</span>
                    <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: totalAvaliacoes > 0 ? `${(d.count / totalAvaliacoes) * 100}%` : "0%" }} />
                    </div>
                    <span className="text-xs text-slate-400">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Seja o primeiro a avaliar este produto.</p>
          )}
        </div>

        {!mostrarForm && !submetida && (
          <button onClick={() => setMostrarForm(true)}
            className="rounded-xl px-4 py-2.5 text-sm font-bold border-2 transition-colors hover:text-white"
            style={{ borderColor: cor, color: cor }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = cor; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ""; (e.currentTarget as HTMLButtonElement).style.color = cor; }}>
            Escrever avaliação
          </button>
        )}
      </div>

      {submetida && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-sm text-green-700 font-medium">
          ✓ Obrigado! A sua avaliação foi submetida e será publicada após moderação.
        </div>
      )}

      {mostrarForm && !submetida && (
        <div className="mb-8">
          <FormAvaliacao
            lojaId={lojaId} produtoId={produtoId} pedidoId={pedidoId} cor={cor}
            onSubmetida={() => { setSubmetida(true); setMostrarForm(false); }}
          />
        </div>
      )}

      {avaliacoes.length === 0 ? (
        <p className="text-sm text-slate-400 py-4">Ainda sem avaliações aprovadas.</p>
      ) : (
        <div className="space-y-5">
          {avaliacoes.map(av => (
            <div key={av.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                    style={{ background: cor }}>
                    {(av.clienteNome ?? "A").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{av.clienteNome ?? "Cliente verificado"}</p>
                    <Estrelas valor={av.estrelas} tamanho="sm" />
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(av.criadaEm).toLocaleDateString("pt-PT")}
                </span>
              </div>
              {av.comentario && (
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{av.comentario}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
