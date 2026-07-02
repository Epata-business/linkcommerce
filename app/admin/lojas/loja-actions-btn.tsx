"use client";

import { useState, useTransition } from "react";
import { removerLoja, togglePublicada } from "./actions";

export function RemoverLojaBtn({ lojaId, nomeLoja }: { lojaId: string; nomeLoja: string }) {
  const [confirmar, setConfirmar] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirmar) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-red-600 font-medium">Confirmar?</span>
        <button
          onClick={() => startTransition(() => removerLoja(lojaId))}
          disabled={isPending}
          className="rounded px-2 py-0.5 text-xs font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
          {isPending ? "…" : "Sim"}
        </button>
        <button onClick={() => setConfirmar(false)}
          className="rounded px-2 py-0.5 text-xs text-slate-500 hover:text-slate-800">
          Não
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirmar(true)}
      title={`Remover ${nomeLoja}`}
      className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
      🗑 Remover
    </button>
  );
}

export function TogglePublicadaBtn({ lojaId, publicada }: { lojaId: string; publicada: boolean }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => togglePublicada(lojaId, !publicada))}
      disabled={isPending}
      className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-60
        ${publicada ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
      {isPending ? "…" : publicada ? "Pública" : "Privada"}
    </button>
  );
}
