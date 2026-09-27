"use client";

import { useState, useTransition } from "react";
import { enviarCampanha } from "./campanhas-actions";

export function EnviarCampanhaBtn({ campanhaId, totalClientes }: { campanhaId: string; totalClientes: number }) {
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ enviados: number; falhados: number } | null>(null);

  function handleEnviar() {
    if (!confirm(`Enviar esta campanha para ${totalClientes} cliente${totalClientes !== 1 ? "s" : ""}?`)) return;
    startTransition(async () => {
      const res = await enviarCampanha(campanhaId);
      if (res && "enviados" in res) setResultado({ enviados: res.enviados ?? 0, falhados: res.falhados ?? 0 });
    });
  }

  if (resultado) {
    return (
      <span className="text-xs text-green-600 font-semibold">
        ✓ {resultado.enviados} enviados{resultado.falhados > 0 && `, ${resultado.falhados} falhados`}
      </span>
    );
  }

  return (
    <button
      onClick={handleEnviar}
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
    >
      {pending ? "A enviar..." : "Enviar"}
    </button>
  );
}
