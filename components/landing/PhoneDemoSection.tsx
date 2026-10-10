"use client";
// v2 — sem label pré-visualização, temas reais, IA honesta
import { useEffect, useState } from "react";

const SCREENS = [
  {
    id: "login",
    label: "Acesso seguro",
    sublabel: "Login rápido com Google ou email",
    content: <LoginScreen />,
  },
  {
    id: "dashboard",
    label: "Dashboard em tempo real",
    sublabel: "Receita, pedidos e clientes num só lugar",
    content: <DashboardScreen />,
  },
  {
    id: "produtos",
    label: "Gestão de produtos",
    sublabel: "Catálogo, stock e variantes num só lugar",
    content: <ProdutosScreen />,
  },
  {
    id: "pos",
    label: "Ponto de venda",
    sublabel: "Registe vendas presenciais e sincronize o stock",
    content: <PosScreen />,
  },
  {
    id: "temas",
    label: "Temas da loja",
    sublabel: "Visual personalizado para cada nicho de negócio",
    content: <TemasScreen />,
  },
  {
    id: "descricoes",
    label: "Descrições com IA",
    sublabel: "Gera descrições de produto com Claude — no formulário",
    content: <DescricoesScreen />,
  },
  {
    id: "loja",
    label: "Loja pública",
    sublabel: "O que o seu cliente vê ao entrar na loja",
    content: <LojaScreen />,
  },
];

const INTERVAL = 3400;

export function PhoneDemoSection({ locale }: { locale: string }) {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setActive(prev => (prev + 1) % SCREENS.length);
        setAnimating(false);
      }, 300);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const screen = SCREENS[active];

  const sectionTitle =
    locale === "en" ? "Everything in the palm of your hand" :
    locale === "fr" ? "Tout dans la paume de votre main" :
    locale === "es" ? "Todo en la palma de tu mano" :
    "Tudo na palma da mão";

  const sectionSub =
    locale === "en" ? "From login to your public store — the complete experience, built for mobile." :
    locale === "fr" ? "Du login à votre boutique — l'expérience complète, pensée mobile." :
    locale === "es" ? "Del login a tu tienda — la experiencia completa, pensada para móvil." :
    "Do login à loja pública — a experiência completa da plataforma.";

  return (
    <section className="py-24 px-6 overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="max-w-6xl mx-auto">

        {/* Header — sem label "pré-visualização" */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">{sectionTitle}</h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">{sectionSub}</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">

          {/* Phone mockup */}
          <div className="relative flex-shrink-0">
            {/* Glow */}
            <div className="absolute inset-0 rounded-[3rem] blur-3xl opacity-30 pointer-events-none"
              style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)", transform: "scale(0.85) translateY(10%)" }} />

            {/* Phone shell */}
            <div className="relative w-[280px] h-[580px] rounded-[3rem] overflow-hidden"
              style={{
                background: "#0a0a12",
                border: "2px solid rgba(255,255,255,0.12)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}>

              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-7 z-20"
                style={{ background: "#0a0a12", borderRadius: "0 0 1rem 1rem" }}>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-3 rounded-full"
                  style={{ background: "#080A12" }} />
              </div>

              {/* Status bar */}
              <div className="absolute top-0 inset-x-0 h-10 flex items-end justify-between px-6 pb-1.5 z-10">
                <span className="text-[10px] font-semibold text-white/40">9:41</span>
                <div className="flex items-center gap-1">
                  <div className="flex gap-0.5 items-end">
                    {[3, 5, 7, 9].map((h, i) => (
                      <div key={i} className="w-1 rounded-sm" style={{ height: `${h}px`, background: i < 3 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)" }} />
                    ))}
                  </div>
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                    <path d="M1 5.5C2.5 3 4.5 2 7 2s4.5 1 6 3.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M3.5 7.5C4.5 6 5.6 5.2 7 5.2s2.5.8 3.5 2.3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="7" cy="9" r="1" fill="rgba(255,255,255,0.5)"/>
                  </svg>
                  <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
                    <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                    <rect x="2" y="2" width="14" height="7" rx="1.5" fill="rgba(255,255,255,0.4)"/>
                    <path d="M20 3.5v3c.8-.4.8-2.6 0-3z" fill="rgba(255,255,255,0.3)"/>
                  </svg>
                </div>
              </div>

              {/* Screen content */}
              <div className={`absolute inset-0 pt-10 transition-opacity duration-300 ${animating ? "opacity-0" : "opacity-100"}`}>
                {screen.content}
              </div>

              {/* Bottom home indicator */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.2)" }} />
            </div>

            {/* Side buttons */}
            <div className="absolute left-[-4px] top-28 w-1 h-8 rounded-l-sm" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="absolute left-[-4px] top-40 w-1 h-12 rounded-l-sm" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="absolute left-[-4px] top-56 w-1 h-12 rounded-l-sm" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="absolute right-[-4px] top-36 w-1 h-16 rounded-r-sm" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Right: labels + progress */}
          <div className="flex flex-col gap-3 w-full max-w-sm">
            {/* Current screen info */}
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-3 text-xs font-bold"
                style={{ background: "rgba(21,61,236,0.15)", border: "1px solid rgba(21,61,236,0.3)", color: "#a5b4fc" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#8381FB" }} />
                {locale === "en" ? "Live demo" : "Demo ao vivo"}
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{screen.label}</h3>
              <p className="text-white/40 text-sm">{screen.sublabel}</p>
            </div>

            {/* Screen list */}
            {SCREENS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setAnimating(true); setTimeout(() => { setActive(i); setAnimating(false); }, 300); }}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200"
                style={{
                  background: i === active ? "rgba(21,61,236,0.12)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${i === active ? "rgba(21,61,236,0.35)" : "rgba(255,255,255,0.05)"}`,
                }}>
                <div className="flex-shrink-0 w-2 h-2 rounded-full transition-all duration-300"
                  style={{ background: i === active ? "#153DEC" : "rgba(255,255,255,0.1)", boxShadow: i === active ? "0 0 8px rgba(21,61,236,0.6)" : "none" }} />
                <span className={`text-sm font-medium transition-colors ${i === active ? "text-white" : "text-white/30"}`}>
                  {s.label}
                </span>
                {i === active && (
                  <div className="ml-auto">
                    <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full" style={{
                        background: "linear-gradient(90deg,#153DEC,#8381FB)",
                        animation: `countdown ${INTERVAL}ms linear forwards`,
                        width: "100%",
                      }} />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes countdown {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </section>
  );
}

/* ── SCREENS ────────────────────────────────────────────────── */

function LoginScreen() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8" style={{ background: "linear-gradient(180deg,#08091a,#0d1030)" }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg mb-6"
        style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)", boxShadow: "0 0 24px rgba(21,61,236,0.5)" }}>
        LC
      </div>
      <h2 className="text-white text-base font-bold mb-1">LinkCommerce</h2>
      <p className="text-white/30 text-xs mb-8">Bem-vindo de volta</p>

      <div className="w-full space-y-3">
        <div className="rounded-xl px-4 py-3 text-xs text-white/40 flex items-center gap-2"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          email@exemplo.com
        </div>
        <div className="rounded-xl px-4 py-3 text-xs text-white/40 flex items-center gap-2"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          ••••••••
        </div>
        <div className="rounded-xl px-4 py-3 text-xs font-bold text-white text-center"
          style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)", boxShadow: "0 4px 16px rgba(21,61,236,0.4)" }}>
          Entrar
        </div>
        <div className="rounded-xl px-4 py-3 text-xs text-white/50 text-center flex items-center justify-center gap-2"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuar com Google
        </div>
      </div>
    </div>
  );
}

function DashboardScreen() {
  return (
    <div className="h-full flex flex-col" style={{ background: "#0f1020" }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <p className="text-[10px] text-white/30">Boa tarde 👋</p>
          <p className="text-xs font-bold text-white">Dashboard</p>
        </div>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)" }}>M</div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 py-3">
        {[
          { label: "Receita", val: "245K", up: "+18%" },
          { label: "Pedidos", val: "38", up: "+12%" },
          { label: "Clientes", val: "124", up: "+9%" },
        ].map((k, i) => (
          <div key={i} className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[8px] text-white/30 mb-1">{k.label}</p>
            <p className="text-sm font-black text-white">{k.val}</p>
            <p className="text-[8px] text-green-400">{k.up}</p>
          </div>
        ))}
      </div>

      <div className="px-4 pb-2">
        <p className="text-[9px] text-white/30 mb-2">Vendas — últimos 7 dias</p>
        <div className="flex items-end gap-1 h-16">
          {[30, 55, 40, 70, 50, 85, 100].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm"
              style={{ height: `${h * 0.64}px`, background: i === 6 ? "linear-gradient(to top,#153DEC,#8381FB)" : "rgba(131,129,251,0.15)" }} />
          ))}
        </div>
      </div>

      <div className="px-4 flex-1">
        <p className="text-[9px] text-white/30 mb-2">Pedidos recentes</p>
        <div className="space-y-1.5">
          {[
            { n: "Maria A.", p: "Vestido Azul", s: "Entregue", c: "#4ade80" },
            { n: "João M.", p: "Ténis Preto", s: "Em curso", c: "#a5b4fc" },
            { n: "Ana S.", p: "Mala de mão", s: "Pendente", c: "#fbbf24" },
          ].map((o, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg px-2.5 py-2"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                  style={{ background: "rgba(21,61,236,0.25)" }}>{o.n[0]}</div>
                <div>
                  <p className="text-[9px] font-medium text-white">{o.n}</p>
                  <p className="text-[8px] text-white/30">{o.p}</p>
                </div>
              </div>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: o.c, background: `${o.c}18` }}>{o.s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProdutosScreen() {
  return (
    <div className="h-full flex flex-col" style={{ background: "#0f1020" }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-xs font-bold text-white">Produtos</p>
        <div className="rounded-lg px-2.5 py-1 text-[9px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)" }}>+ Novo</div>
      </div>
      <div className="px-4 pt-3 pb-2">
        <div className="rounded-lg px-3 py-2 flex items-center gap-2"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <span className="text-[10px] text-white/25">Pesquisar produtos…</span>
        </div>
      </div>
      <div className="flex-1 px-4 space-y-2 overflow-hidden">
        {[
          { name: "Camisola Merino Premium", price: "89.000 Kz", stock: 24, img: "🧥" },
          { name: "Calças de Linho", price: "124.000 Kz", stock: 8, img: "👖" },
          { name: "Boné Algodão", price: "45.000 Kz", stock: 32, img: "🧢" },
          { name: "Ténis Running", price: "215.000 Kz", stock: 5, img: "👟" },
        ].map((p, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: "rgba(21,61,236,0.15)" }}>{p.img}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-white truncate">{p.name}</p>
              <p className="text-[9px] text-white/40">{p.price}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-[8px] text-white/30">Stock</p>
              <p className="text-[10px] font-bold" style={{ color: p.stock <= 8 ? "#fbbf24" : "#4ade80" }}>{p.stock}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PosScreen() {
  return (
    <div className="h-full flex flex-col" style={{ background: "#0a0d1e" }}>
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-xs font-bold text-white">Ponto de Venda</p>
        <p className="text-[9px] text-white/30 mt-0.5">Venda presencial</p>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 pt-3 pb-2">
        {[
          { name: "Camisola", price: "89K", emoji: "🧥" },
          { name: "Calças", price: "124K", emoji: "👖" },
          { name: "Boné", price: "45K", emoji: "🧢" },
          { name: "Ténis", price: "215K", emoji: "👟" },
        ].map((p, i) => (
          <div key={i} className="rounded-xl p-2.5 flex flex-col items-center gap-1"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="text-xl">{p.emoji}</span>
            <p className="text-[9px] text-white/60">{p.name}</p>
            <p className="text-[9px] font-bold text-white">{p.price} Kz</p>
          </div>
        ))}
      </div>

      <div className="mx-4 rounded-xl p-3" style={{ background: "rgba(21,61,236,0.08)", border: "1px solid rgba(21,61,236,0.2)" }}>
        <div className="flex justify-between mb-2">
          <p className="text-[9px] text-white/40">Carrinho</p>
          <p className="text-[9px] font-bold text-white">2 itens</p>
        </div>
        {[
          { n: "Camisola Merino", v: "89.000 Kz" },
          { n: "Boné Algodão", v: "45.000 Kz" },
        ].map((item, i) => (
          <div key={i} className="flex justify-between">
            <p className="text-[9px] text-white/50">{item.n}</p>
            <p className="text-[9px] text-white/70">{item.v}</p>
          </div>
        ))}
        <div className="border-t mt-2 pt-2 flex justify-between" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-[9px] font-bold text-white">Total</p>
          <p className="text-[9px] font-bold text-white">134.000 Kz</p>
        </div>
      </div>

      <div className="mx-4 mt-2 rounded-xl py-2.5 text-center text-[10px] font-bold text-white"
        style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)" }}>
        Confirmar venda
      </div>
    </div>
  );
}

// Temas — mini-mockups reais de loja pública por nicho
function TemasScreen() {
  const [selected, setSelected] = useState("essencial");

  const temas = [
    {
      slug: "essencial",
      label: "Essencial",
      free: true,
      heroBg: "linear-gradient(135deg,#153DEC18,#8381FB08)",
      heroText: "#1e293b",
      cardBg: "#f8fafc",
      accent: "#153DEC",
      prodBg: "#f1f5f9",
    },
    {
      slug: "moda",
      label: "Moda",
      free: true,
      heroBg: "linear-gradient(135deg,#1a1a1a,#2d2d2d)",
      heroText: "#fff",
      cardBg: "#1a1a1a",
      accent: "#fff",
      prodBg: "#111",
    },
    {
      slug: "beleza",
      label: "Beleza",
      free: true,
      heroBg: "linear-gradient(135deg,#fff5f7,#fce4ea)",
      heroText: "#881337",
      cardBg: "#fff",
      accent: "#C4748A",
      prodBg: "#fff8fa",
    },
    {
      slug: "gourmet",
      label: "Gourmet",
      free: true,
      heroBg: "linear-gradient(135deg,#fff8f0,#fde8d8)",
      heroText: "#7c2d12",
      cardBg: "#fff",
      accent: "#8B2500",
      prodBg: "#fdf5ee",
    },
    {
      slug: "calcado",
      label: "Calçado",
      free: false,
      heroBg: "linear-gradient(135deg,#1C2B3A,#2e3f52)",
      heroText: "#e2e8f0",
      cardBg: "#1C2B3A",
      accent: "#94a3b8",
      prodBg: "#141f2a",
    },
    {
      slug: "electronica",
      label: "Eletrónica",
      free: false,
      heroBg: "linear-gradient(135deg,#001833,#002a5c)",
      heroText: "#bfdbfe",
      cardBg: "#001223",
      accent: "#3b82f6",
      prodBg: "#000d1a",
    },
  ];

  const t = temas.find(x => x.slug === selected) ?? temas[0];

  return (
    <div className="h-full flex flex-col" style={{ background: "#0f1020" }}>
      <div className="px-3 pt-3 pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-[10px] font-bold text-white mb-2">Temas da Loja</p>
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {temas.map(x => (
            <button key={x.slug} onClick={() => setSelected(x.slug)}
              className="flex-shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold transition-all"
              style={x.slug === selected
                ? { background: "rgba(21,61,236,0.3)", color: "#a5b4fc", border: "1px solid rgba(21,61,236,0.5)" }
                : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }
              }>
              {x.label}
              {!x.free && <span className="ml-1 opacity-70">Pro</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Mini storefront preview */}
      <div className="flex-1 mx-3 my-2 rounded-xl overflow-hidden" style={{ background: t.prodBg }}>
        {/* Mini hero */}
        <div className="px-3 py-3 text-center" style={{ background: t.heroBg }}>
          <div className="w-6 h-6 rounded-lg mx-auto mb-1 flex items-center justify-center text-[9px] font-black"
            style={{ background: t.accent, color: t.heroBg.includes("fff") || t.heroBg.includes("f0") ? "#fff" : t.heroText }}>
            M
          </div>
          <p className="text-[9px] font-bold" style={{ color: t.heroText }}>Minha Loja</p>
          <p className="text-[7px] opacity-50" style={{ color: t.heroText }}>12 produtos</p>
        </div>

        {/* Mini products */}
        <div className="grid grid-cols-2 gap-1.5 p-2">
          {[
            { name: "Camisola", price: "89K Kz", emoji: "🧥" },
            { name: "Calças", price: "124K Kz", emoji: "👖" },
            { name: "Boné", price: "45K Kz", emoji: "🧢" },
            { name: "Ténis", price: "215K Kz", emoji: "👟" },
          ].map((p, i) => (
            <div key={i} className="rounded-lg overflow-hidden" style={{ background: t.cardBg, border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="h-10 flex items-center justify-center text-lg" style={{ background: `${t.accent}12` }}>
                {p.emoji}
              </div>
              <div className="p-1.5">
                <p className="text-[7px] font-semibold truncate" style={{ color: t.heroText }}>{p.name}</p>
                <p className="text-[7px] font-black" style={{ color: t.accent }}>{p.price}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Badge plano */}
        <div className="mx-2 mb-2 text-center">
          <span className="text-[7px] font-bold rounded-full px-2 py-0.5"
            style={t.free
              ? { background: "rgba(74,222,128,0.15)", color: "#4ade80" }
              : { background: "rgba(251,191,36,0.15)", color: "#fbbf24" }
            }>
            {t.free ? "Grátis" : "Pro"}
          </span>
        </div>
      </div>

      <div className="mx-3 mb-3 rounded-xl py-2 text-center text-[9px] font-bold text-white"
        style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)" }}>
        Aplicar tema {t.label}
      </div>
    </div>
  );
}

// Descrições com IA — mostra o que existe de facto: gerador no formulário de produto
function DescricoesScreen() {
  const [generated, setGenerated] = useState(false);

  return (
    <div className="h-full flex flex-col" style={{ background: "#0f1020" }}>
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-xs font-bold text-white">Editar Produto</p>
        <p className="text-[9px] text-white/30 mt-0.5">Camisola Merino Premium</p>
      </div>

      <div className="flex-1 px-4 pt-3 flex flex-col gap-2 overflow-hidden">
        {/* Campo título */}
        <div>
          <p className="text-[8px] text-white/40 mb-1">Título</p>
          <div className="rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[9px] text-white">Camisola Merino Premium</p>
          </div>
        </div>

        {/* Campo preço */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[8px] text-white/40 mb-1">Preço</p>
            <div className="rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[9px] text-white">89.000 Kz</p>
            </div>
          </div>
          <div>
            <p className="text-[8px] text-white/40 mb-1">Stock</p>
            <div className="rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[9px] text-white">24</p>
            </div>
          </div>
        </div>

        {/* Campo descrição com botão IA */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[8px] text-white/40">Descrição</p>
            <button onClick={() => setGenerated(true)}
              className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[8px] font-bold transition-all"
              style={{ background: "rgba(131,129,251,0.15)", color: "#a5b4fc", border: "1px solid rgba(131,129,251,0.25)" }}>
              ✦ Gerar com Claude
            </button>
          </div>
          <div className="rounded-lg px-3 py-2 min-h-[70px]"
            style={{ background: "rgba(255,255,255,0.04)", border: generated ? "1px solid rgba(131,129,251,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
            {generated ? (
              <p className="text-[8px] text-white/70 leading-relaxed">
                Camisola de lã merino premium, suave ao toque e ideal para os dias mais frios. Design elegante e versátil, disponível em vários tamanhos.
              </p>
            ) : (
              <p className="text-[8px] text-white/20">Escreve uma descrição ou clica em "Gerar com Claude"…</p>
            )}
          </div>
          {generated && (
            <p className="text-[7px] mt-1" style={{ color: "#8381FB" }}>✦ Gerado por Claude · Podes editar antes de guardar</p>
          )}
        </div>

        {/* Aviso de transparência */}
        <div className="rounded-lg px-3 py-2 flex gap-2" style={{ background: "rgba(21,61,236,0.08)", border: "1px solid rgba(21,61,236,0.15)" }}>
          <span className="text-[8px]">ℹ️</span>
          <p className="text-[7px] text-white/40 leading-relaxed">Geração de descrições disponível no plano Starter e acima.</p>
        </div>
      </div>

      <div className="mx-4 mb-3 mt-1 rounded-xl py-2.5 text-center text-[10px] font-bold text-white"
        style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)" }}>
        Guardar produto
      </div>
    </div>
  );
}

function LojaScreen() {
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "#fff" }}>
      <div className="px-4 pt-4 pb-3 text-center" style={{ background: "linear-gradient(135deg,#153DEC18,#8381FB08)" }}>
        <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center font-black text-white text-sm"
          style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)" }}>M</div>
        <p className="text-xs font-bold text-slate-800">Minha Loja</p>
        <p className="text-[8px] text-slate-400">12 produtos disponíveis</p>
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 mt-1 text-[7px] font-bold"
          style={{ background: "rgba(21,61,236,0.08)", color: "#153DEC" }}>
          <span className="w-1 h-1 rounded-full animate-pulse bg-[#153DEC]" /> Loja aberta
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 px-3 pt-2 flex-1 overflow-hidden">
        {[
          { name: "Camisola Merino", price: "89.000 Kz", emoji: "🧥" },
          { name: "Calças Linho", price: "124.000 Kz", emoji: "👖" },
          { name: "Boné Algodão", price: "45.000 Kz", emoji: "🧢" },
          { name: "Ténis Running", price: "215.000 Kz", emoji: "👟" },
        ].map((p, i) => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ background: "#f8f9ff", border: "1px solid #eee" }}>
            <div className="h-14 flex items-center justify-center text-2xl" style={{ background: "linear-gradient(135deg,#153DEC10,#8381FB08)" }}>
              {p.emoji}
            </div>
            <div className="p-2">
              <p className="text-[8px] font-semibold text-slate-800 truncate">{p.name}</p>
              <p className="text-[8px] font-black mt-0.5" style={{ color: "#153DEC" }}>{p.price}</p>
              <div className="mt-1 rounded-md py-0.5 text-center text-[7px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)" }}>
                Adicionar
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-3 mb-2 mt-1 rounded-xl px-3 py-2 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)" }}>
        <span className="text-[9px] font-bold text-white">🛒 Carrinho (2)</span>
        <span className="text-[9px] font-bold text-white/80">89.000 Kz</span>
      </div>
    </div>
  );
}
