"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
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
      <h2 className="text-xl font-bold text-slate-900 mb-2">Erro no painel admin</h2>
      <p className="text-slate-500 mb-6 max-w-sm text-sm">{error.message}</p>
      <div className="flex gap-3">
        <button onClick={reset} className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          Tentar novamente
        </button>
        <Link href="/" className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Início
        </Link>
      </div>
    </div>
  );
}
