"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface ContaSocial {
  id: string;
  plataforma: string;
  nomeExibido: string;
  accountId: string;
  criadaEm: string;
}

interface Publicacao {
  id: string;
  conteudo: string;
  plataformas: string;
  estado: string;
  agendadoPara: string | null;
  publicadoEm: string | null;
  criadoEm: string;
}

// ── Platform config ──────────────────────────────────────────────────────────

const PLATAFORMAS: {
  id: string;
  label: string;
  cor: string;
  icon: string;
}[] = [
  { id: "instagram", label: "Instagram", cor: "#E1306C", icon: "📷" },
  { id: "facebook",  label: "Facebook",  cor: "#1877F2", icon: "📘" },
  { id: "linkedin",  label: "LinkedIn",  cor: "#0A66C2", icon: "💼" },
  { id: "twitter",   label: "X / Twitter", cor: "#000000", icon: "𝕏" },
  { id: "tiktok",    label: "TikTok",    cor: "#010101", icon: "🎵" },
  { id: "youtube",   label: "YouTube",   cor: "#FF0000", icon: "▶" },
];

function plataformaInfo(id: string) {
  return PLATAFORMAS.find((p) => p.id === id) ?? { id, label: id, cor: "#64748b", icon: "🌐" };
}

// ── Status badge ─────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    agendado:  { label: "Agendado",  cls: "bg-blue-100 text-blue-700" },
    publicado: { label: "Publicado", cls: "bg-green-100 text-green-700" },
    falhado:   { label: "Falhado",   cls: "bg-red-100 text-red-700" },
    rascunho:  { label: "Rascunho",  cls: "bg-slate-100 text-slate-600" },
  };
  const cfg = map[estado] ?? { label: estado, cls: "bg-slate-100 text-slate-600" };
  return (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RedesSociaisClient({
  contasIniciais,
  publicacoesIniciais,
}: {
  contasIniciais: ContaSocial[];
  publicacoesIniciais: Publicacao[];
}) {
  const [tab, setTab] = useState<"contas" | "publicar" | "historico">("contas");
  const [contas, setContas] = useState<ContaSocial[]>(contasIniciais);
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>(publicacoesIniciais);

  // ── Connect account ────────────────────────────────────────────────────────

  const [connecting, setConnecting] = useState<string | null>(null);

  async function ligarConta(platform: string) {
    setConnecting(platform);
    try {
      const res = await fetch(`/api/zernio/connect?platform=${platform}`);
      const data = await res.json();
      if (!res.ok || !data.authUrl) throw new Error(data.erro ?? "Erro ao obter URL");

      const popup = window.open(data.authUrl, "_blank", "width=600,height=700,noopener");

      // Poll for popup close then sync
      const poll = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(poll);
          // Sync newly connected account
          const cb = await fetch("/api/zernio/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileId: data.profileId, platform }),
          });
          if (cb.ok) {
            const { conta } = await cb.json();
            if (conta) {
              const listRes = await fetch("/api/zernio/accounts");
              if (listRes.ok) {
                const { contas: novas } = await listRes.json();
                setContas(novas);
              }
            }
          }
          setConnecting(null);
        }
      }, 1000);
    } catch (e) {
      alert((e as Error).message);
      setConnecting(null);
    }
  }

  async function removerConta(id: string) {
    if (!confirm("Remover esta conta social?")) return;
    const res = await fetch(`/api/zernio/accounts?id=${id}`, { method: "DELETE" });
    if (res.ok) setContas((prev) => prev.filter((c) => c.id !== id));
  }

  // ── Publish form ──────────────────────────────────────────────────────────

  const [conteudo, setConteudo] = useState("");
  const [contasSelecionadas, setContasSelecionadas] = useState<string[]>([]);
  const [agendarPara, setAgendarPara] = useState("");
  const [publicarAgora, setPublicarAgora] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [erroPublicar, setErroPublicar] = useState("");
  const [sucessoPublicar, setSucessoPublicar] = useState("");

  function toggleConta(id: string) {
    setContasSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function publicar() {
    setErroPublicar("");
    setSucessoPublicar("");
    if (!conteudo.trim()) return setErroPublicar("Escreva o conteúdo da publicação.");
    if (contasSelecionadas.length === 0) return setErroPublicar("Selecione pelo menos uma conta.");
    if (!publicarAgora && !agendarPara) return setErroPublicar("Defina a data de agendamento.");

    startTransition(async () => {
      const res = await fetch("/api/zernio/publicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conteudo,
          contaIds: contasSelecionadas,
          publicarAgora,
          agendadoPara: !publicarAgora ? agendarPara : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErroPublicar(data.erro ?? "Erro ao publicar.");
      } else {
        setSucessoPublicar(publicarAgora ? "Publicado com sucesso!" : "Agendado com sucesso!");
        setConteudo("");
        setContasSelecionadas([]);
        setAgendarPara("");
        // Refresh history
        const histRes = await fetch("/api/zernio/publicar");
        if (histRes.ok) {
          const { publicacoes: novas } = await histRes.json();
          setPublicacoes(novas);
        }
        setTimeout(() => setSucessoPublicar(""), 4000);
      }
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
        {(["contas", "publicar", "historico"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === t
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {t === "contas" ? "Contas ligadas" : t === "publicar" ? "Nova publicação" : "Histórico"}
          </button>
        ))}
      </div>

      {/* ── Tab: Contas ──────────────────────────────────────────────── */}
      {tab === "contas" && (
        <div>
          {contas.length > 0 && (
            <div className="mb-6 space-y-2">
              {contas.map((c) => {
                const p = plataformaInfo(c.plataforma);
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-white"
                  >
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: p.cor + "18" }}
                    >
                      {p.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.nomeExibido}</p>
                      <p className="text-xs text-slate-400">{p.label}</p>
                    </div>
                    <button
                      onClick={() => removerConta(c.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Ligar nova conta</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PLATAFORMAS.map((p) => {
                const jaLigada = contas.some((c) => c.plataforma === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => !jaLigada && ligarConta(p.id)}
                    disabled={jaLigada || connecting === p.id}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all",
                      jaLigada
                        ? "border-green-200 bg-green-50 text-green-700 cursor-default"
                        : connecting === p.id
                        ? "border-slate-200 bg-slate-50 text-slate-400 cursor-wait"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm text-slate-700"
                    )}
                  >
                    <span className="text-base">{p.icon}</span>
                    <span>{p.label}</span>
                    {jaLigada && <span className="ml-auto text-green-500 text-xs">✓</span>}
                    {connecting === p.id && (
                      <span className="ml-auto text-xs text-slate-400 animate-pulse">...</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {contas.length === 0 && (
            <p className="text-sm text-slate-400 text-center mt-8 pb-4">
              Ligue a sua primeira conta social para começar a publicar.
            </p>
          )}
        </div>
      )}

      {/* ── Tab: Publicar ────────────────────────────────────────────── */}
      {tab === "publicar" && (
        <div className="space-y-5">
          {contas.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg mb-2">Nenhuma conta ligada</p>
              <p className="text-sm">
                Vá a{" "}
                <button
                  className="text-blue-600 underline"
                  onClick={() => setTab("contas")}
                >
                  Contas ligadas
                </button>{" "}
                e ligue pelo menos uma rede social.
              </p>
            </div>
          ) : (
            <>
              {/* Platform selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Publicar em
                </label>
                <div className="flex flex-wrap gap-2">
                  {contas.map((c) => {
                    const p = plataformaInfo(c.plataforma);
                    const sel = contasSelecionadas.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleConta(c.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all",
                          sel
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        )}
                      >
                        <span>{p.icon}</span>
                        <span>{c.nomeExibido}</span>
                        {sel && <span className="text-blue-500">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content textarea */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Conteúdo
                </label>
                <textarea
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  placeholder="Escreva o texto da sua publicação..."
                  maxLength={2200}
                  rows={6}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-400 text-right mt-1">
                  {conteudo.length}/2200
                </p>
              </div>

              {/* Schedule toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quando publicar
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setPublicarAgora(true)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                      publicarAgora
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    Publicar agora
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublicarAgora(false)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                      !publicarAgora
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    )}
                  >
                    Agendar
                  </button>
                </div>

                {!publicarAgora && (
                  <input
                    type="datetime-local"
                    value={agendarPara}
                    onChange={(e) => setAgendarPara(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* Errors / success */}
              {erroPublicar && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {erroPublicar}
                </p>
              )}
              {sucessoPublicar && (
                <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                  ✓ {sucessoPublicar}
                </p>
              )}

              <Button onClick={publicar} disabled={isPending} className="w-full">
                {isPending
                  ? "A publicar..."
                  : publicarAgora
                  ? "Publicar agora"
                  : "Agendar publicação"}
              </Button>
            </>
          )}
        </div>
      )}

      {/* ── Tab: Histórico ───────────────────────────────────────────── */}
      {tab === "historico" && (
        <div>
          {publicacoes.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">
              Ainda não fez nenhuma publicação.
            </p>
          ) : (
            <div className="space-y-3">
              {publicacoes.map((pub) => {
                const plataformas: string[] = (() => {
                  try { return JSON.parse(pub.plataformas); }
                  catch { return []; }
                })();
                const data = pub.publicadoEm ?? pub.agendadoPara ?? pub.criadoEm;
                return (
                  <div
                    key={pub.id}
                    className="p-4 border border-slate-200 rounded-xl bg-white"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex flex-wrap gap-1">
                        {plataformas.map((pl) => {
                          const p = plataformaInfo(pl);
                          return (
                            <span
                              key={pl}
                              className="text-sm"
                              title={p.label}
                            >
                              {p.icon}
                            </span>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <EstadoBadge estado={pub.estado} />
                        <span className="text-xs text-slate-400">
                          {new Date(data).toLocaleDateString("pt-PT", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-3 whitespace-pre-wrap">
                      {pub.conteudo}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
