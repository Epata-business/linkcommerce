'use client';
import { useState, useRef } from 'react';

interface Props {
  subdominio: string;
  nomeLoja: string;
}

export function StorePreviewButton({ subdominio, nomeLoja }: Props) {
  const [open, setOpen] = useState(false);
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewUrl = `/loja/${subdominio}`;

  const refresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = previewUrl + '?t=' + Date.now();
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        style={{ background: 'rgba(21,61,236,0.15)', color: '#8381FB', border: '1px solid rgba(131,129,251,0.3)' }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
        Ver loja
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2,5,61,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="flex flex-col w-full max-w-5xl max-h-[92vh] rounded-2xl overflow-hidden"
            style={{ background: '#0d0f1a', border: '1px solid rgba(131,129,251,0.2)' }}>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs text-white/40"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/>
                  </svg>
                  {nomeLoja} · preview
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Device toggle */}
                <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  <button
                    onClick={() => setDevice('mobile')}
                    className="px-2.5 py-1.5 text-xs transition-colors"
                    style={{ background: device === 'mobile' ? 'rgba(21,61,236,0.3)' : 'transparent', color: device === 'mobile' ? '#fff' : 'rgba(255,255,255,0.4)' }}
                    title="Telemóvel"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setDevice('desktop')}
                    className="px-2.5 py-1.5 text-xs transition-colors"
                    style={{ background: device === 'desktop' ? 'rgba(21,61,236,0.3)' : 'transparent', color: device === 'desktop' ? '#fff' : 'rgba(255,255,255,0.4)' }}
                    title="Desktop"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  </button>
                </div>

                {/* Refresh */}
                <button onClick={refresh} className="p-1.5 rounded-lg transition-colors hover:bg-white/10 text-white/50 hover:text-white" title="Atualizar">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </button>

                {/* Open in new tab */}
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg transition-colors hover:bg-white/10 text-white/50 hover:text-white"
                  title="Abrir em nova aba"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                </a>

                {/* Close */}
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Preview area */}
            <div className="flex-1 flex items-center justify-center overflow-auto py-6 px-4" style={{ background: '#080a12' }}>
              {device === 'mobile' ? (
                // Phone mockup
                <div className="relative flex-shrink-0" style={{ width: 375, height: 680 }}>
                  {/* Phone frame */}
                  <div className="absolute inset-0 rounded-[40px] pointer-events-none z-10"
                    style={{ border: '10px solid #1a1d2e', boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 40px 80px rgba(0,0,0,0.6)', background: 'transparent' }} />
                  {/* Notch */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full z-20 pointer-events-none"
                    style={{ background: '#1a1d2e' }} />
                  {/* Home bar */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full z-20 pointer-events-none"
                    style={{ background: 'rgba(255,255,255,0.2)' }} />
                  <iframe
                    ref={iframeRef}
                    src={previewUrl}
                    className="w-full h-full rounded-[32px] overflow-hidden"
                    style={{ border: 'none' }}
                    title="Preview da loja"
                  />
                </div>
              ) : (
                // Desktop mockup
                <div className="relative w-full max-w-3xl flex-shrink-0">
                  {/* Screen */}
                  <div className="rounded-t-xl overflow-hidden" style={{ border: '8px solid #1a1d2e', boxShadow: '0 0 0 1px rgba(255,255,255,0.06)' }}>
                    {/* Browser chrome */}
                    <div className="flex items-center gap-2 px-3 py-2" style={{ background: '#1a1d2e' }}>
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                      </div>
                      <div className="flex-1 rounded px-3 py-0.5 text-[10px] text-white/30 text-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {nomeLoja.toLowerCase().replace(/\s/g, '')}.linkcommerce.app
                      </div>
                    </div>
                    <iframe
                      ref={iframeRef}
                      src={previewUrl}
                      className="w-full"
                      style={{ height: 500, border: 'none' }}
                      title="Preview da loja desktop"
                    />
                  </div>
                  {/* Stand */}
                  <div className="mx-auto" style={{ width: 80, height: 24, background: '#1a1d2e', borderRadius: '0 0 4px 4px' }} />
                  <div className="mx-auto rounded" style={{ width: 140, height: 6, background: '#1a1d2e' }} />
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2.5 text-center text-xs border-t" style={{ color: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.06)' }}>
              Este é um preview da sua loja — as alterações guardadas aparecem aqui em tempo real após atualizar
            </div>
          </div>
        </div>
      )}
    </>
  );
}
