"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type QrCodeItem = {
  id: string;
  slug: string;
  nome: string;
  destino: string;
  ativo: boolean;
  totalScans: number;
  scansHoje: number;
  scans7d: number;
  criadoEm: Date;
};

const TAMANHOS = [
  { label: "Pequeno",  size: 300 },
  { label: "Médio",   size: 600 },
  { label: "Grande",  size: 1200 },
];

export function QrCodeManager({
  qrcodes,
  rootDomain,
  lojaUrl,
  cor: corInicial,
}: {
  qrcodes: QrCodeItem[];
  rootDomain: string;
  lojaUrl: string;
  cor: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"lista" | "criar">("lista");
  const [nome, setNome] = useState("");
  const [destino, setDestino] = useState(lojaUrl);
  const [erro, setErro] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editDestino, setEditDestino] = useState("");
  const [tamanhoSel, setTamanhoSel] = useState(600);
  const [cor, setCor] = useState(corInicial.replace("#", ""));

  function qrUrl(slug: string) {
    return `https://${rootDomain}/q/${slug}`;
  }

  function qrPreviewUrl(url: string) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&color=${cor}&bgcolor=ffffff&qzone=2`;
  }

  async function downloadQr(slug: string, nomeQr: string) {
    const url = qrUrl(slug);
    const apiUrl = `/api/qrcode?data=${encodeURIComponent(url)}&size=${tamanhoSel}&color=${cor}`;
    const res = await fetch(apiUrl);
    if (!res.ok) return;
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `qr-${nomeQr.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }

  function criarQr() {
    setErro(null);
    if (!nome.trim() || !destino.trim()) {
      setErro("Nome e destino são obrigatórios.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/qrcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, destino }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.erro ?? "Erro ao criar."); return; }
      setNome("");
      setDestino(lojaUrl);
      setTab("lista");
      router.refresh();
    });
  }

  function guardarDestino(id: string) {
    startTransition(async () => {
      await fetch(`/api/qrcodes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destino: editDestino }),
      });
      setEditandoId(null);
      router.refresh();
    });
  }

  function toggleAtivo(id: string, ativo: boolean) {
    startTransition(async () => {
      await fetch(`/api/qrcodes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !ativo }),
      });
      router.refresh();
    });
  }

  const CORES = [
    { hex: "153DFC", label: "Azul" },
    { hex: "0f172a", label: "Preto" },
    { hex: "6d28d9", label: "Roxo" },
    { hex: "0d9488", label: "Verde" },
    { hex: "dc2626", label: "Vermelho" },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: "lista", label: `QR Codes (${qrcodes.length})` },
          { key: "criar", label: "+ Novo QR Code" },
        ].map((t) => (
          <button key={t.key}
            onClick={() => setTab(t.key as "lista" | "criar")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors
              ${tab === t.key ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "criar" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm max-w-lg">
          <h2 className="text-base font-black text-slate-800 mb-4">Novo QR Code dinâmico</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Nome (uso interno)</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Montra Porto, Flyer Agosto"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Destino (URL)</label>
              <input
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Pode ser alterado depois sem reimprimir o QR.</p>
            </div>
            {erro && <p className="text-xs text-red-500">{erro}</p>}
            <button
              onClick={criarQr}
              disabled={isPending}
              className="w-full rounded-xl py-3 text-sm font-black text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50 transition-colors">
              {isPending ? "A criar…" : "Criar QR Code"}
            </button>
          </div>
        </div>
      )}

      {tab === "lista" && (
        <div className="space-y-4">
          {/* Opções de download */}
          <div className="flex items-center gap-4 flex-wrap bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm">
            <p className="text-xs font-bold text-slate-400 mr-2">Download:</p>
            <div className="flex gap-2">
              {TAMANHOS.map((t) => (
                <button key={t.size}
                  onClick={() => setTamanhoSel(t.size)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors
                    ${tamanhoSel === t.size ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 ml-auto">
              {CORES.map((c) => (
                <button key={c.hex}
                  onClick={() => setCor(c.hex)}
                  title={c.label}
                  className="w-6 h-6 rounded-lg border-2 transition-all hover:scale-110"
                  style={{
                    background: `#${c.hex}`,
                    borderColor: cor === c.hex ? `#${c.hex}` : "transparent",
                    outline: cor === c.hex ? `2px solid #${c.hex}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>

          {qrcodes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
              <p className="text-3xl mb-3">📱</p>
              <p className="font-bold text-slate-700">Ainda sem QR Codes</p>
              <p className="text-sm text-slate-400 mt-1">Cria o primeiro QR Code dinâmico acima.</p>
            </div>
          ) : (
            qrcodes.map((qr) => {
              const url = qrUrl(qr.slug);
              return (
                <div key={qr.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${qr.ativo ? "border-slate-100" : "border-slate-200 opacity-60"}`}>
                  <div className="flex gap-4 p-5">
                    {/* QR preview */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrPreviewUrl(url)}
                      alt={qr.nome}
                      className="w-20 h-20 rounded-xl border border-slate-100 flex-shrink-0"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-slate-800">{qr.nome}</p>
                        {!qr.ativo && (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-400 rounded-full px-2 py-0.5">
                            Inativo
                          </span>
                        )}
                      </div>

                      {editandoId === qr.id ? (
                        <div className="flex gap-2 mt-2">
                          <input
                            value={editDestino}
                            onChange={(e) => setEditDestino(e.target.value)}
                            className="flex-1 text-xs font-mono rounded-lg border border-slate-200 px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => guardarDestino(qr.id)}
                            disabled={isPending}
                            className="text-xs font-bold text-green-600 hover:text-green-800 px-2">
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditandoId(null)}
                            className="text-xs text-slate-400 hover:text-slate-600">
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-mono truncate mt-0.5">{qr.destino}</p>
                      )}

                      <p className="text-[10px] font-mono text-slate-300 mt-0.5">{url}</p>

                      {/* Stats */}
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs text-slate-500"><span className="font-black text-slate-800">{qr.totalScans}</span> scans</span>
                        <span className="text-xs text-slate-400"><span className="font-bold">{qr.scans7d}</span> últimos 7 dias</span>
                        <span className="text-xs text-slate-400"><span className="font-bold">{qr.scansHoje}</span> hoje</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 px-5 pb-4">
                    <button
                      onClick={() => downloadQr(qr.slug, qr.nome)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                      ↓ Descarregar
                    </button>
                    <span className="text-slate-200">|</span>
                    <button
                      onClick={() => {
                        setEditandoId(qr.id);
                        setEditDestino(qr.destino);
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors">
                      Editar destino
                    </button>
                    <span className="text-slate-200">|</span>
                    <button
                      onClick={() => toggleAtivo(qr.id, qr.ativo)}
                      disabled={isPending}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50">
                      {qr.ativo ? "Desactivar" : "Activar"}
                    </button>
                    <span className="ml-auto text-[10px] text-slate-300">
                      Criado {new Date(qr.criadoEm).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
