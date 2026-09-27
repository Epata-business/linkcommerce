"use client";

import { useState } from "react";

export function CopiarChave({ chave }: { chave: string }) {
  const [copiado, setCopiado] = useState(false);

  function copiar() {
    navigator.clipboard.writeText(chave).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <code className="flex-1 min-w-0 block bg-white border border-green-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 overflow-x-auto whitespace-nowrap">
        {chave}
      </code>
      <button
        onClick={copiar}
        className="flex-shrink-0 rounded-xl px-3 py-2 text-xs font-bold bg-green-600 text-white hover:bg-green-700 transition-colors"
      >
        {copiado ? "✓ Copiado" : "Copiar"}
      </button>
    </div>
  );
}
