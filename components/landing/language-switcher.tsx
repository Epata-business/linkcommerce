'use client';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const LANGS = [
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'fr', label: 'Français',  flag: '🇫🇷' },
  { code: 'es', label: 'Español',   flag: '🇪🇸' },
];

export function LanguageSwitcher({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const active = LANGS.find(l => l.code === current) ?? LANGS[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchTo = (code: string) => {
    window.location.href = `/api/locale?lang=${code}&back=${encodeURIComponent(pathname)}`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all select-none"
        style={{
          background: open ? 'rgba(21,61,236,0.2)' : 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff',
        }}
      >
        <span>{active.flag}</span>
        <span>{active.code.toUpperCase()}</span>
        <svg
          className="w-3 h-3 text-white/50 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden z-50"
          style={{
            background: 'rgba(8,10,18,0.97)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          }}
        >
          {LANGS.map(lang => (
            <button
              key={lang.code}
              onClick={() => { switchTo(lang.code); setOpen(false); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left"
              style={{
                background: lang.code === current ? 'rgba(21,61,236,0.25)' : 'transparent',
                color: lang.code === current ? '#fff' : 'rgba(255,255,255,0.6)',
              }}
              onMouseEnter={e => { if (lang.code !== current) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (lang.code !== current) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span className="text-base">{lang.flag}</span>
              <span className="font-medium">{lang.label}</span>
              {lang.code === current && (
                <svg className="ml-auto w-4 h-4 text-[#8381FB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
