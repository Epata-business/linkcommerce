"use client";

import Link from "next/link";

const PASSOS = [
  {
    id: "personalizar",
    icon: "🎨",
    titulo: "Personalize a sua loja",
    descricao: "Adicione o logótipo, cor da marca e descrição",
    href: "/dashboard/configuracoes",
    cta: "Ir para configurações",
  },
  {
    id: "produto",
    icon: "📦",
    titulo: "Adicione o primeiro produto",
    descricao: "Crie o seu catálogo com fotos, preço e descrição",
    href: "/dashboard/produtos",
    cta: "Adicionar produto",
  },
  {
    id: "partilhar",
    icon: "🔗",
    titulo: "Partilhe o link da sua loja",
    descricao: "Envie o link aos seus clientes para começar a vender",
    href: "/dashboard/configuracoes",
    cta: "Ver link da loja",
  },
  {
    id: "qrcode",
    icon: "📱",
    titulo: "Descarregue o QR Code",
    descricao: "Imprima e coloque no seu negócio físico",
    href: "/dashboard/qrcode",
    cta: "Ver QR Code",
  },
];

export function OnboardingChecklist({ nomePlano }: { nomePlano: string | null }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🚀</span>
            <h2 className="font-black text-slate-900 text-lg">Configure a sua loja</h2>
          </div>
          <p className="text-sm text-slate-500">
            Siga estes passos para começar a vender
            {nomePlano && <span className="ml-1 text-indigo-600 font-semibold">· Plano {nomePlano}</span>}
          </p>
        </div>
        <div className="flex gap-1">
          {PASSOS.map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-indigo-200" />
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {PASSOS.map((passo, i) => (
          <Link
            key={passo.id}
            href={passo.href}
            className="group flex items-start gap-3 rounded-xl bg-white border border-slate-100 p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-lg flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
              {passo.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Passo {i + 1}</span>
              </div>
              <p className="text-sm font-bold text-slate-800 leading-tight mt-0.5">{passo.titulo}</p>
              <p className="text-xs text-slate-400 mt-0.5">{passo.descricao}</p>
              <p className="text-xs font-semibold text-indigo-600 mt-2 group-hover:text-indigo-700">{passo.cta} →</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
