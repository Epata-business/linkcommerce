"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const TAMANHOS = [
  { label: "Pequeno", desc: "300×300px", size: 300 },
  { label: "Médio", desc: "600×600px", size: 600 },
  { label: "Grande", desc: "1200×1200px", size: 1200 },
];

const USOS = [
  { icon: "🪧", texto: "Montra e balcão" },
  { icon: "📄", texto: "Flyers e brochuras" },
  { icon: "📦", texto: "Embalagens" },
  { icon: "📱", texto: "Redes sociais" },
];

export default function QRCodePage() {
  const [lojaUrl, setLojaUrl] = useState<string>("");
  const [subdominio, setSubdominio] = useState<string>("");
  const [nomeLoja, setNomeLoja] = useState<string>("");
  const [copiado, setCopiado] = useState(false);
  const [tamanhoSel, setTamanhoSel] = useState(600);
  const [cor, setCor] = useState("153DFC");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/loja/info")
      .then((r) => r.json())
      .then((data) => {
        if (data.subdominio) {
          setSubdominio(data.subdominio);
          setLojaUrl(data.url);
          setNomeLoja(data.nome ?? data.subdominio);
        }
      })
      .finally(() => setCarregando(false));
  }, []);

  const qrPreview = lojaUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(lojaUrl)}&color=${cor}&bgcolor=ffffff&qzone=2`
    : "";

  function copiar() {
    if (!lojaUrl) return;
    navigator.clipboard.writeText(lojaUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function download() {
    if (!lojaUrl) return;
    const apiUrl = `/api/qrcode?data=${encodeURIComponent(lojaUrl)}&size=${tamanhoSel}&color=${cor}`;
    const res = await fetch(apiUrl);
    if (!res.ok) return;
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `qrcode-${subdominio || "loja"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-black text-slate-900 mt-3">QR Code da loja</h1>
          <p className="text-slate-400 text-sm mt-1">
            Gere e descarregue o QR Code para os seus clientes acederem à loja.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-6">

          {/* Painel esquerdo — QR + preview */}
          <div className="md:col-span-3 space-y-5">

            {/* Card QR Code */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Faixa decorativa topo */}
              <div className="h-1.5 w-full" style={{ background: `#${cor}` }} />

              <div className="flex flex-col items-center px-8 py-10">
                {/* QR Code */}
                <div className="rounded-2xl border-2 border-slate-100 p-4 bg-white shadow-inner">
                  {carregando ? (
                    <div className="w-48 h-48 rounded-xl bg-slate-100 animate-pulse" />
                  ) : qrPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrPreview} alt="QR Code" className="w-48 h-48 block" />
                  ) : (
                    <div className="w-48 h-48 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs text-center px-4">
                      Sem loja configurada
                    </div>
                  )}
                </div>

                {/* Nome da loja sob o QR */}
                {nomeLoja && (
                  <div className="mt-4 text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">LinkCommerce</p>
                    <p className="text-base font-bold text-slate-800 mt-0.5">{nomeLoja}</p>
                  </div>
                )}

                {/* URL */}
                <div className="mt-5 w-full">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <span className="flex-1 text-xs text-slate-600 font-mono truncate">
                      {lojaUrl || "A carregar…"}
                    </span>
                    <button
                      onClick={copiar}
                      className="text-[11px] font-bold px-2 py-1 rounded-lg transition-colors shrink-0"
                      style={{ color: copiado ? "#16a34a" : `#${cor}` }}
                    >
                      {copiado ? "✓ Copiado" : "Copiar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Casos de uso */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Onde usar</p>
              <div className="grid grid-cols-2 gap-2">
                {USOS.map((u) => (
                  <div key={u.texto} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                    <span className="text-lg">{u.icon}</span>
                    <span className="text-xs font-semibold text-slate-600">{u.texto}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Painel direito — opções */}
          <div className="md:col-span-2 space-y-5">

            {/* Cor */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Cor do QR Code</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { hex: "153DFC", label: "Azul" },
                  { hex: "0f172a", label: "Preto" },
                  { hex: "6d28d9", label: "Roxo" },
                  { hex: "0d9488", label: "Verde" },
                  { hex: "dc2626", label: "Vermelho" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setCor(c.hex)}
                    title={c.label}
                    className="w-9 h-9 rounded-xl border-2 transition-all hover:scale-110"
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

            {/* Tamanho */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Tamanho do ficheiro</p>
              <div className="space-y-2">
                {TAMANHOS.map((t) => (
                  <button
                    key={t.size}
                    onClick={() => setTamanhoSel(t.size)}
                    className="w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all"
                    style={{
                      borderColor: tamanhoSel === t.size ? `#${cor}` : "#e2e8f0",
                      background: tamanhoSel === t.size ? `#${cor}12` : "white",
                    }}
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">{t.label}</p>
                      <p className="text-[11px] text-slate-400">{t.desc}</p>
                    </div>
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: tamanhoSel === t.size ? `#${cor}` : "#cbd5e1" }}
                    >
                      {tamanhoSel === t.size && (
                        <div className="w-2 h-2 rounded-full" style={{ background: `#${cor}` }} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Botões de acção */}
            <div className="space-y-2">
              <button
                onClick={download}
                disabled={!lojaUrl}
                className="w-full rounded-xl py-3.5 text-sm font-black text-white transition-all disabled:opacity-40 hover:opacity-90 shadow-sm"
                style={{ background: `#${cor}` }}
              >
                Descarregar PNG
              </button>

              {lojaUrl && (
                <a
                  href={lojaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-xl border border-slate-200 py-3.5 text-sm font-bold text-slate-700 text-center hover:bg-slate-50 transition-colors"
                >
                  Abrir loja →
                </a>
              )}
            </div>

            {/* Nota informativa */}
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              O QR Code funciona assim que a loja estiver publicada. Qualquer alteração ao URL gera um novo código.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
