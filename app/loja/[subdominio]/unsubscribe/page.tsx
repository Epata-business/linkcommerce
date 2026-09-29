"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function UnsubscribeForm({ subdominio }: { subdominio: string }) {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailParam);
  const [estado, setEstado] = useState<"idle" | "loading" | "ok" | "erro">("idle");
  const [mensagem, setMensagem] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setEstado("loading");
    try {
      const res = await fetch(`/api/loja/${subdominio}/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setEstado("ok");
      } else {
        setEstado("erro");
        setMensagem(data.erro ?? "Erro ao processar o pedido.");
      }
    } catch {
      setEstado("erro");
      setMensagem("Erro de rede. Tente novamente.");
    }
  }

  if (estado === "ok") {
    return (
      <div className="text-center space-y-3">
        <div className="text-5xl">✅</div>
        <h2 className="text-xl font-bold text-slate-800">Cancelado com sucesso</h2>
        <p className="text-slate-500 text-sm">
          O endereço <strong>{email}</strong> foi removido da lista de marketing desta loja.
          Continuará a receber emails de confirmação de pedidos.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Endereço de email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>
      {estado === "erro" && (
        <p className="text-sm text-red-600">{mensagem}</p>
      )}
      <button
        type="submit"
        disabled={estado === "loading" || !email.trim()}
        className="w-full rounded-xl bg-slate-800 py-3 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
      >
        {estado === "loading" ? "A processar…" : "Cancelar subscrição de marketing"}
      </button>
      <p className="text-xs text-slate-400 text-center">
        Continuará a receber emails transacionais (confirmação de pedidos, envio, etc.)
      </p>
    </form>
  );
}

export default function UnsubscribePage({ params }: { params: { subdominio: string } }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">📧</div>
          <h1 className="text-xl font-bold text-slate-900">Cancelar subscrição de marketing</h1>
          <p className="text-sm text-slate-500">
            Confirme o seu email para parar de receber emails de marketing desta loja.
          </p>
        </div>
        <Suspense fallback={<div className="h-24 animate-pulse bg-slate-100 rounded-xl" />}>
          <UnsubscribeForm subdominio={params.subdominio} />
        </Suspense>
      </div>
    </div>
  );
}
