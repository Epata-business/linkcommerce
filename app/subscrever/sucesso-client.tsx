"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function SubscreverSucesso({ jaAtiva }: { jaAtiva: boolean }) {
  const router = useRouter();
  const [tentativas, setTentativas] = useState(0);
  const [ativa, setAtiva] = useState(jaAtiva);

  useEffect(() => {
    if (ativa) {
      setTimeout(() => router.push("/dashboard"), 2000);
      return;
    }
    // Polling — verifica a cada 2s até a subscrição estar activa (max 30s)
    if (tentativas >= 15) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/billing/status");
        const data = await res.json();
        if (data.ativa) {
          setAtiva(true);
          setTimeout(() => router.push("/dashboard"), 1500);
        } else {
          setTentativas(t => t + 1);
        }
      } catch {
        setTentativas(t => t + 1);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [tentativas, ativa, router]);

  if (ativa) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-slate-900">Subscrição activada!</h1>
        <p className="text-slate-500 mt-2">A redirigir para o dashboard…</p>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <div className="mx-auto h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
        <svg className="h-8 w-8 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Pagamento recebido!</h1>
      <p className="text-slate-500 mt-2">A confirmar a subscrição…</p>
      {tentativas >= 15 && (
        <p className="text-sm text-amber-600 mt-4">
          A activação está a demorar mais que o esperado.{" "}
          <button onClick={() => router.push("/dashboard")} className="underline font-semibold">
            Entrar no dashboard →
          </button>
        </p>
      )}
    </div>
  );
}
