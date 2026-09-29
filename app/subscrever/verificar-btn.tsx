"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function VerificarPagamentoBtn() {
  const router = useRouter();
  const [estado, setEstado] = useState<"idle" | "loading" | "ok" | "nao-encontrado">("idle");

  async function verificar() {
    setEstado("loading");
    try {
      const res = await fetch("/api/billing/verificar", { method: "POST" });
      const data = await res.json();
      if (data.jaAtiva || data.ativada) {
        setEstado("ok");
        router.push("/dashboard");
      } else {
        setEstado("nao-encontrado");
      }
    } catch {
      setEstado("nao-encontrado");
    }
  }

  if (estado === "ok") {
    return (
      <p className="mt-4 text-sm text-green-600 font-semibold">✓ Subscrição confirmada. A redirigir…</p>
    );
  }

  return (
    <div className="mt-6">
      <p className="text-xs text-slate-400 mb-2">Já efectuou um pagamento mas não tem acesso?</p>
      <button
        onClick={verificar}
        disabled={estado === "loading"}
        className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
      >
        {estado === "loading" ? "A verificar pagamento…" : "Verificar pagamento Stripe"}
      </button>
      {estado === "nao-encontrado" && (
        <p className="mt-2 text-xs text-amber-600">
          Não encontrámos um pagamento confirmado. Se fez uma transferência bancária,{" "}
          <a href="https://wa.me/244939720871" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
            contacte-nos via WhatsApp
          </a>{" "}
          para activação manual.
        </p>
      )}
    </div>
  );
}
