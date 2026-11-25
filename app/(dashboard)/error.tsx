"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-4 text-center">
      <div className="mb-3"><AlertTriangle className="w-10 h-10 text-amber-500" strokeWidth={1.75} /></div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Erro ao carregar</h2>
      <p className="text-sm text-slate-500 mb-4">
        {error.message || "Ocorreu um erro inesperado."}
      </p>
      <button
        onClick={reset}
        className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );
}
