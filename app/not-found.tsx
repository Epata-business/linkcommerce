import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center bg-slate-50">
      <div className="text-6xl font-extrabold text-indigo-600 mb-2">404</div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Página não encontrada</h2>
      <p className="text-slate-500 mb-6 max-w-sm">
        A página que procura não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
