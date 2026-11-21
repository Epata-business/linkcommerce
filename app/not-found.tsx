import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center" style={{ background: "#F7F8FC" }}>
      <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">Erro 404</p>
      <h1 className="text-5xl font-black text-[#0F1117] mb-3 tracking-tight">Página não encontrada</h1>
      <p className="text-[#4B5563] mb-8 max-w-sm text-sm leading-relaxed">
        A página que procura não existe ou foi movida para outro endereço.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-[#153DEC] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1235cc] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao início
      </Link>
    </div>
  );
}
