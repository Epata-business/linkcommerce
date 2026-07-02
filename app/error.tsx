"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
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
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Algo correu mal</h2>
      <p className="text-slate-500 mb-6 max-w-sm">
        Ocorreu um erro inesperado. Pode tentar novamente ou voltar à página inicial.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Página inicial
        </Link>
      </div>
    </div>
  );
}
