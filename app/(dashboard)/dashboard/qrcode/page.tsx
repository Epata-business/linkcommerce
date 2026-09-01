"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/ui/back-button";

export default function QRCodePage() {
  const [lojaUrl, setLojaUrl] = useState<string>("");
  const [subdominio, setSubdominio] = useState<string>("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(async (session) => {
        if (!session?.user) return;
        const res = await fetch("/api/loja/info");
        if (!res.ok) return;
        const data = await res.json();
        setSubdominio(data.subdominio);
        setLojaUrl(data.url);
      });
  }, []);

  const qrUrl = lojaUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(lojaUrl)}&color=153DFC&bgcolor=ffffff&qzone=2`
    : "";

  function copiar() {
    navigator.clipboard.writeText(lojaUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function download() {
    const link = document.createElement("a");
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(lojaUrl)}&color=153DFC&bgcolor=ffffff&qzone=3&format=png`;
    link.download = `qrcode-${subdominio}.png`;
    link.click();
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <BackButton href="/dashboard" label="← Dashboard" />
      <h1 className="text-xl font-bold text-slate-900 mt-4 mb-1">QR Code da loja</h1>
      <p className="text-sm text-slate-500 mb-8">
        Partilha ou imprime este código para os clientes acederem à tua loja no telemóvel.
      </p>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center gap-6">
        {qrUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrUrl} alt="QR Code da loja" className="w-56 h-56 rounded-xl" />
        ) : (
          <div className="w-56 h-56 rounded-xl bg-slate-100 animate-pulse" />
        )}

        <div className="w-full space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Link da loja</p>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="flex-1 text-sm text-slate-700 font-mono truncate">{lojaUrl || "A carregar…"}</span>
            <button
              onClick={copiar}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors shrink-0"
            >
              {copiado ? "✓ Copiado" : "Copiar"}
            </button>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <a
            href={lojaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 text-center hover:bg-slate-50 transition-colors"
          >
            Abrir loja
          </a>
          <button
            onClick={download}
            disabled={!lojaUrl}
            className="flex-1 rounded-xl py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-40"
          >
            Descarregar PNG
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center">
          Ideal para cartões de visita, embalagens, flyers e redes sociais.
        </p>
      </div>
    </div>
  );
}
