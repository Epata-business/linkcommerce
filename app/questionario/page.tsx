import type { Metadata } from "next";
import { QuestionarioForm } from "./questionario-form";

export const metadata: Metadata = {
  title: "Questionário de mercado — LinkCommerce",
  description: "Ajude-nos a construir a melhor plataforma de comércio eletrónico para o mercado lusófono. 5 minutos, 12 perguntas.",
};

export default function QuestionarioPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <div className="mx-auto max-w-2xl px-4 pt-12 pb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300 mb-6">
          ⏱️ Apenas 5 minutos · 12 blocos
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
          Ajude-nos a construir<br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400"> a loja ideal para si</span>
        </h1>
        <p className="text-slate-400 text-base max-w-lg mx-auto">
          As suas respostas definem o que vamos construir a seguir no LinkCommerce.
          Sem spam. Sem compromissos.
        </p>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-2xl px-4 pb-20">
        <QuestionarioForm />
      </div>
    </div>
  );
}
