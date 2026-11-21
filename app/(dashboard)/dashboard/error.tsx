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
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" strokeWidth={1.75} />
      <h2 className="text-xl font-bold text-slate-900 mb-2">Erro ao carregar esta página</h2>
      <p className="text-slate-500 mb-6 text-sm max-w-sm">{error.message ?? "Ocorreu um erro inesperado."}</p>
      <button
        onClick={reset}
        className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );
}
