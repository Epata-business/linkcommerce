"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <h2 className="text-2xl font-bold mb-2">Erro crítico</h2>
          <p className="text-slate-500 mb-4">Ocorreu um erro inesperado na aplicação.</p>
          <button
            onClick={reset}
            className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white"
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}
