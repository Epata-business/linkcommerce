"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPCOES = [
  { lang: "pt", label: "Português", flag: "🇵🇹", moeda: "EUR", simbolo: "€" },
  { lang: "en", label: "English",   flag: "🇬🇧", moeda: "USD", simbolo: "$" },
  { lang: "fr", label: "Français",  flag: "🇫🇷", moeda: "EUR", simbolo: "€" },
  { lang: "es", label: "Español",   flag: "🇪🇸", moeda: "EUR", simbolo: "€" },
];

interface Props {
  currentLang: string;
  currentMoeda: string;
}

export function DashboardLocaleSwitcher({ currentLang, currentMoeda }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const active = OPCOES.find(o => o.lang === currentLang) ?? OPCOES[0];

  async function trocar(opcao: typeof OPCOES[0]) {
    if (opcao.lang === currentLang) { setOpen(false); return; }
    setLoading(true);
    setOpen(false);
    try {
      // Actualiza idioma + cookie CUR
      await fetch(`/api/locale?lang=${opcao.lang}&back=/dashboard`, { redirect: "manual" });
      document.cookie = `LC=${opcao.lang};path=/;max-age=31536000;samesite=lax`;
      document.cookie = `CUR=${opcao.moeda};path=/;max-age=31536000;samesite=lax`;

      // Actualiza moeda da loja na BD
      await fetch("/api/loja/moeda", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moeda: opcao.moeda }),
      });

      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-60"
      >
        <span>{active.flag}</span>
        <span>{active.label}</span>
        <span className="ml-auto text-xs text-slate-500">{active.simbolo}</span>
        <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-48 rounded-xl overflow-hidden z-50 shadow-xl"
          style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)" }}>
          {OPCOES.map(op => (
            <button
              key={op.lang}
              onClick={() => trocar(op)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
              style={{
                background: op.lang === currentLang ? "rgba(21,61,236,0.25)" : "transparent",
                color: op.lang === currentLang ? "#fff" : "rgba(255,255,255,0.55)",
              }}
            >
              <span>{op.flag}</span>
              <span className="flex-1">{op.label}</span>
              <span className="text-xs text-slate-500">{op.simbolo}</span>
              {op.lang === currentLang && (
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
