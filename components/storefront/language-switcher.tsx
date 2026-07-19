"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

const LANGS = [
  { code: "pt", label: "PT", flag: "🇵🇹", full: "Português" },
  { code: "en", label: "EN", flag: "🇬🇧", full: "English" },
  { code: "fr", label: "FR", flag: "🇫🇷", full: "Français" },
  { code: "es", label: "ES", flag: "🇪🇸", full: "Español" },
];

export function StorefrontLanguageSwitcher({ current, cor }: { current: string; cor: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const active = LANGS.find(l => l.code === current) ?? LANGS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const trocar = (code: string) => {
    window.location.href = `/api/locale?lang=${code}&back=${encodeURIComponent(pathname)}`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        style={{ borderColor: `${cor}30` }}
      >
        <span>{active.flag}</span>
        <span>{active.label}</span>
        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-xl overflow-hidden z-50 shadow-lg bg-white border border-slate-100">
          {LANGS.map(lang => (
            <button
              key={lang.code}
              onClick={() => { trocar(lang.code); setOpen(false); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-slate-50"
              style={{
                background: lang.code === current ? `${cor}0d` : undefined,
                color: lang.code === current ? cor : "#475569",
                fontWeight: lang.code === current ? 600 : 400,
              }}
            >
              <span>{lang.flag}</span>
              <span>{lang.full}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
