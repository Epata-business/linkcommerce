import Link from "next/link";
import { getLocale, t } from "@/lib/i18n";
import { LiveDashboard } from "@/components/landing/live-dashboard";
import { LanguageSwitcher } from "@/components/landing/language-switcher";
import dynamic from "next/dynamic";

const HeroBackground  = dynamic(() => import("@/components/landing/HeroBackground"), { ssr: false });
const FlowingMenu     = dynamic(() => import("@/components/landing/FlowingMenu"),     { ssr: false });
const GlobalNetwork   = dynamic(() => import("@/components/landing/GlobalNetwork"),   { ssr: false });

/* ── Textos por secção (fallback inline para não sobrecarregar i18n) ── */
const COPY = {
  pt: {
    feat_sell_title: "Venda em todo o lado",
    feat_sell_sub: "A sua loja online sincronizada com o ponto de venda físico — num único painel.",
    feat_pos_title: "Venda presencialmente",
    feat_pos_sub: "POS offline para lojas físicas. Registe vendas sem internet e sincronize automaticamente.",
    feat_manage_title: "Gestão completa",
    feat_manage_sub: "Produtos, pedidos, clientes e stock — tudo integrado e acessível em tempo real.",
    feat_ai_title: "IA integrada",
    feat_ai_sub: "Gere descrições de produto, analise tendências e automatize mensagens com Claude.",
    stats_stores: "Lojas criadas",
    stats_orders: "Pedidos processados",
    stats_countries: "Países",
    stats_uptime: "Disponibilidade",
    how_title: "Do produto ao cliente",
    how_sub: "Cada passo do seu negócio, integrado e automatizado.",
    plans_title: "Comece grátis, cresça ao seu ritmo",
    plans_sub: "Sem surpresas. Mude de plano quando quiser.",
    plans_popular: "POPULAR",
    plans_btn: "Começar",
    cta_title: "Pronto para abrir a sua loja?",
    cta_sub: "Junte-se a centenas de lojistas que já vendem com o LinkCommerce.",
    cta_btn: "Criar a minha loja grátis →",
  },
  en: {
    feat_sell_title: "Sell everywhere",
    feat_sell_sub: "Your online store synced with your physical point of sale — in one single panel.",
    feat_pos_title: "Sell in person",
    feat_pos_sub: "Offline POS for physical stores. Log sales without internet and sync automatically.",
    feat_manage_title: "Complete management",
    feat_manage_sub: "Products, orders, customers and stock — all integrated and accessible in real time.",
    feat_ai_title: "Built-in AI",
    feat_ai_sub: "Generate product descriptions, analyse trends and automate messages with Claude.",
    stats_stores: "Stores created",
    stats_orders: "Orders processed",
    stats_countries: "Countries",
    stats_uptime: "Uptime",
    how_title: "From product to customer",
    how_sub: "Every step of your business, integrated and automated.",
    plans_title: "Start free, grow at your pace",
    plans_sub: "No surprises. Change plans whenever you want.",
    plans_popular: "POPULAR",
    plans_btn: "Get started",
    cta_title: "Ready to open your store?",
    cta_sub: "Join hundreds of merchants already selling with LinkCommerce.",
    cta_btn: "Create my store for free →",
  },
  fr: {
    feat_sell_title: "Vendez partout",
    feat_sell_sub: "Votre boutique en ligne synchronisée avec votre point de vente physique.",
    feat_pos_title: "Vente en personne",
    feat_pos_sub: "Caisse hors ligne pour boutiques physiques. Enregistrez les ventes sans internet.",
    feat_manage_title: "Gestion complète",
    feat_manage_sub: "Produits, commandes, clients et stock — tout intégré et accessible en temps réel.",
    feat_ai_title: "IA intégrée",
    feat_ai_sub: "Générez des descriptions de produits, analysez les tendances avec Claude.",
    stats_stores: "Boutiques créées",
    stats_orders: "Commandes traitées",
    stats_countries: "Pays",
    stats_uptime: "Disponibilité",
    how_title: "Du produit au client",
    how_sub: "Chaque étape de votre entreprise, intégrée et automatisée.",
    plans_title: "Commencez gratuitement",
    plans_sub: "Sans surprises. Changez de forfait quand vous voulez.",
    plans_popular: "POPULAIRE",
    plans_btn: "Commencer",
    cta_title: "Prêt à ouvrir votre boutique?",
    cta_sub: "Rejoignez des centaines de commerçants qui vendent avec LinkCommerce.",
    cta_btn: "Créer ma boutique gratuitement →",
  },
  es: {
    feat_sell_title: "Vende en todas partes",
    feat_sell_sub: "Tu tienda online sincronizada con tu punto de venta físico — en un único panel.",
    feat_pos_title: "Vende en persona",
    feat_pos_sub: "TPV sin conexión para tiendas físicas. Registra ventas sin internet.",
    feat_manage_title: "Gestión completa",
    feat_manage_sub: "Productos, pedidos, clientes y stock — todo integrado y accesible en tiempo real.",
    feat_ai_title: "IA integrada",
    feat_ai_sub: "Genera descripciones de productos, analiza tendencias y automatiza mensajes con Claude.",
    stats_stores: "Tiendas creadas",
    stats_orders: "Pedidos procesados",
    stats_countries: "Países",
    stats_uptime: "Disponibilidad",
    how_title: "Del producto al cliente",
    how_sub: "Cada paso de tu negocio, integrado y automatizado.",
    plans_title: "Empieza gratis, crece a tu ritmo",
    plans_sub: "Sin sorpresas. Cambia de plan cuando quieras.",
    plans_popular: "POPULAR",
    plans_btn: "Empezar",
    cta_title: "¿Listo para abrir tu tienda?",
    cta_sub: "Únete a cientos de comerciantes que ya venden con LinkCommerce.",
    cta_btn: "Crear mi tienda gratis →",
  },
} as const;

const PLANS = [
  { key: "Free",       price: "0€",       period: "",      desc_pt: "Até 10 produtos · 1 utilizador",   desc_en: "Up to 10 products · 1 user",          desc_fr: "Jusqu'à 10 produits · 1 utilisateur", desc_es: "Hasta 10 productos · 1 usuario",       popular: false },
  { key: "Starter",    price: "19€",      period: "/mês",  desc_pt: "Até 100 produtos + domínio próprio", desc_en: "Up to 100 products + custom domain",  desc_fr: "100 produits + domaine personnalisé", desc_es: "100 productos + dominio propio",       popular: false },
  { key: "Growth",     price: "49€",      period: "/mês",  desc_pt: "Ilimitado + API + IA incluída",     desc_en: "Unlimited + API + AI included",       desc_fr: "Illimité + API + IA incluse",         desc_es: "Ilimitado + API + IA incluida",        popular: true  },
  { key: "Enterprise", price: "199€",     period: "/mês",  desc_pt: "White-label + 0% comissão",         desc_en: "White-label + 0% commission",         desc_fr: "White-label + 0% commission",         desc_es: "White-label + 0% comisión",            popular: false },
];

const FLOW = [
  { icon: "📦", pt: "Produto",   en: "Product",  fr: "Produit",  es: "Producto"  },
  { icon: "🛒", pt: "Carrinho",  en: "Cart",     fr: "Panier",   es: "Carrito"   },
  { icon: "💳", pt: "Pagamento", en: "Payment",  fr: "Paiement", es: "Pago"      },
  { icon: "📬", pt: "Pedido",    en: "Order",    fr: "Commande", es: "Pedido"    },
  { icon: "🚚", pt: "Entrega",   en: "Delivery", fr: "Livraison",es: "Entrega"   },
];

export default function HomePage() {
  const locale = getLocale();
  const c = COPY[locale] ?? COPY.pt;

  const planDesc = (p: typeof PLANS[0]) => {
    if (locale === "en") return p.desc_en;
    if (locale === "fr") return p.desc_fr;
    if (locale === "es") return p.desc_es;
    return p.desc_pt;
  };

  const flowItems = [
    { link:"/comecar", text: locale==="en"?"Online Store":locale==="fr"?"Boutique en ligne":locale==="es"?"Tienda online":"Loja Online",        image:"https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=200&fit=crop" },
    { link:"/comecar", text: locale==="en"?"Point of Sale":locale==="fr"?"Point de vente":locale==="es"?"Punto de venta":"Ponto de Venda",       image:"https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop" },
    { link:"/comecar", text: locale==="en"?"Claude AI":locale==="fr"?"Claude IA":locale==="es"?"Claude IA":"Claude IA",                          image:"https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=200&fit=crop" },
    { link:"/comecar", text: locale==="en"?"Analytics":locale==="fr"?"Analytique":locale==="es"?"Análisis":"Analytics",                          image:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop" },
  ];

  return (
    <div className="bg-[#080A12] text-white font-montserrat overflow-x-hidden">

      {/* ── FLUID CURSOR ── */}

      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 px-6 py-4" style={{ background: "rgba(8,10,18,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">
            Link<span className="text-gradient">Commerce</span>
          </span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher current={locale} />
            <Link href="/entrar" className="text-sm font-medium text-white/60 hover:text-white transition-colors px-3 py-2">
              {t("landing_cta_login", locale)}
            </Link>
            <Link href="/comecar"
              className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-all hover:scale-105 hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)", boxShadow: "0 0 20px rgba(21,61,236,0.4)" }}>
              {t("landing_cta_start", locale)}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section data-hero className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20 overflow-hidden">
        {/* Custom canvas hero background — brand blue/violet particles + aurora */}
        <HeroBackground />
        {/* Gradient overlay — keeps text crisp */}
        <div className="absolute inset-0 pointer-events-none" style={{ background:"linear-gradient(180deg,rgba(8,10,18,0.35) 0%,rgba(8,10,18,0.1) 40%,rgba(8,10,18,0.65) 100%)" }} />

        {/* Badge */}
        <div className="relative z-10 mb-7">
          <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold"
            style={{ borderColor: "rgba(21,61,236,0.5)", background: "rgba(21,61,236,0.12)", color: "#a5b4fc" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#153DEC] animate-pulse" />
            {t("landing_badge", locale)}
          </span>
        </div>

        {/* Title */}
        <h1 className="relative z-10 text-center text-5xl sm:text-6xl lg:text-[72px] font-extrabold leading-[1.08] mb-5 tracking-tight">
          {t("landing_h1a", locale)}<br />
          <span className="text-gradient">{t("landing_h1b", locale)}</span>
        </h1>

        <p className="relative z-10 text-center text-lg text-white/45 max-w-lg mb-10 leading-relaxed">
          {t("landing_sub", locale)}
        </p>

        {/* CTAs */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 mb-20">
          <Link href="/comecar"
            className="rounded-full px-8 py-3.5 text-base font-semibold text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)", boxShadow: "0 0 32px rgba(21,61,236,0.55)" }}>
            {locale === "en" ? "Create my store for free →" : locale === "fr" ? "Créer ma boutique →" : locale === "es" ? "Crear mi tienda →" : "Criar a minha loja grátis →"}
          </Link>
          <Link href="/entrar"
            className="rounded-full px-8 py-3.5 text-base font-medium text-white/60 border transition-all hover:border-white/30 hover:text-white"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            {t("landing_cta_login", locale)}
          </Link>
        </div>

        {/* Live Dashboard */}
        <div className="relative z-10 w-full max-w-3xl">
          <LiveDashboard />
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="relative py-10 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(21,61,236,0.04)" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { num: "500+",   label: c.stats_stores },
            { num: "12K+",   label: c.stats_orders },
            { num: "30+",    label: c.stats_countries },
            { num: "99.9%",  label: c.stats_uptime },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-gradient">{s.num}</p>
              <p className="text-xs text-white/35 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURE CARDS (Shopify style) ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto space-y-5">

          {/* Row 1: Sell everywhere (wide) + POS (narrow) */}
          <div className="grid md:grid-cols-3 gap-5">
            {/* Vender em todo o lado — 2/3 */}
            <div className="md:col-span-2 rounded-3xl overflow-hidden relative min-h-[340px] flex flex-col justify-between p-8"
              style={{ background: "linear-gradient(135deg, #0a1230 0%, #02053D 100%)", border: "1px solid rgba(21,61,236,0.2)" }}>
              {/* Mockup da loja dentro do card */}
              <div className="absolute bottom-0 right-0 w-64 h-52 rounded-tl-2xl overflow-hidden opacity-80"
                style={{ background: "rgba(21,61,236,0.08)", border: "1px solid rgba(21,61,236,0.15)", borderRight: "none", borderBottom: "none" }}>
                <div className="p-3 space-y-2">
                  <div className="flex gap-2 items-center">
                    <div className="w-10 h-10 rounded-lg" style={{ background: "rgba(131,129,251,0.3)" }} />
                    <div className="flex-1 space-y-1">
                      <div className="h-2 rounded-full w-24" style={{ background: "rgba(255,255,255,0.12)" }} />
                      <div className="h-1.5 rounded-full w-16" style={{ background: "rgba(255,255,255,0.07)" }} />
                    </div>
                    <span className="text-xs font-bold text-green-400">89€</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="w-10 h-10 rounded-lg" style={{ background: "rgba(21,61,236,0.3)" }} />
                    <div className="flex-1 space-y-1">
                      <div className="h-2 rounded-full w-20" style={{ background: "rgba(255,255,255,0.12)" }} />
                      <div className="h-1.5 rounded-full w-12" style={{ background: "rgba(255,255,255,0.07)" }} />
                    </div>
                    <span className="text-xs font-bold text-green-400">124€</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="w-10 h-10 rounded-lg" style={{ background: "rgba(131,129,251,0.2)" }} />
                    <div className="flex-1 space-y-1">
                      <div className="h-2 rounded-full w-28" style={{ background: "rgba(255,255,255,0.12)" }} />
                      <div className="h-1.5 rounded-full w-14" style={{ background: "rgba(255,255,255,0.07)" }} />
                    </div>
                    <span className="text-xs font-bold text-green-400">45€</span>
                  </div>
                  <div className="mt-3 rounded-lg py-2 text-center text-[10px] font-bold text-white"
                    style={{ background: "linear-gradient(90deg,#153DEC,#8381FB)" }}>
                    linkcommerce.app/loja
                  </div>
                </div>
              </div>
              <div className="relative z-10 max-w-xs">
                <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold mb-4"
                  style={{ background: "rgba(21,61,236,0.2)", color: "#a5b4fc", border: "1px solid rgba(21,61,236,0.3)" }}>
                  🛍️ {locale === "en" ? "Online Store" : locale === "fr" ? "Boutique en ligne" : locale === "es" ? "Tienda online" : "Loja Online"}
                </div>
                <h3 className="text-2xl font-extrabold leading-snug mb-3">{c.feat_sell_title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{c.feat_sell_sub}</p>
              </div>
            </div>

            {/* POS — 1/3 */}
            <div className="rounded-3xl overflow-hidden relative min-h-[340px] flex flex-col justify-between p-8"
              style={{ background: "linear-gradient(160deg, #0d0f1f 0%, #1a0a2e 100%)", border: "1px solid rgba(131,129,251,0.2)" }}>
              {/* Mockup tablet POS */}
              <div className="absolute bottom-0 right-0 left-0 flex justify-center">
                <div className="w-40 h-36 rounded-t-2xl mx-auto overflow-hidden opacity-70"
                  style={{ background: "rgba(131,129,251,0.08)", border: "1px solid rgba(131,129,251,0.15)", borderBottom: "none" }}>
                  <div className="p-2.5 space-y-1.5">
                    <div className="grid grid-cols-2 gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-lg h-8" style={{ background: i === 0 ? "rgba(131,129,251,0.35)" : "rgba(255,255,255,0.06)" }} />
                      ))}
                    </div>
                    <div className="rounded-lg py-1.5 text-center text-[9px] font-bold text-white"
                      style={{ background: "linear-gradient(90deg,#153DEC,#8381FB)" }}>
                      {locale === "en" ? "Confirm" : locale === "fr" ? "Confirmer" : locale === "es" ? "Confirmar" : "Confirmar"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold mb-4"
                  style={{ background: "rgba(131,129,251,0.15)", color: "#c4b5fd", border: "1px solid rgba(131,129,251,0.3)" }}>
                  📲 POS
                </div>
                <h3 className="text-xl font-extrabold leading-snug mb-3">{c.feat_pos_title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{c.feat_pos_sub}</p>
              </div>
            </div>
          </div>

          {/* Row 2: Management + AI */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* Gestão */}
            <div className="rounded-3xl overflow-hidden relative min-h-[280px] flex flex-col justify-between p-8"
              style={{ background: "linear-gradient(135deg, #080c1a 0%, #0d1535 100%)", border: "1px solid rgba(21,61,236,0.15)" }}>
              <div className="absolute bottom-0 right-6 flex gap-2 items-end">
                {[55, 72, 60, 88, 75, 95, 100].map((h, i) => (
                  <div key={i} className="w-5 rounded-t-md transition-all"
                    style={{
                      height: `${h * 0.85}px`,
                      background: i === 6 ? "linear-gradient(180deg,#153DEC,#8381FB)" : "rgba(131,129,251,0.18)",
                      opacity: i === 6 ? 1 : 0.6 + i * 0.05,
                    }} />
                ))}
              </div>
              <div className="relative z-10 max-w-xs">
                <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold mb-4"
                  style={{ background: "rgba(21,61,236,0.15)", color: "#a5b4fc", border: "1px solid rgba(21,61,236,0.25)" }}>
                  📊 {locale === "en" ? "Analytics" : locale === "fr" ? "Analytique" : locale === "es" ? "Análisis" : "Analytics"}
                </div>
                <h3 className="text-xl font-extrabold leading-snug mb-3">{c.feat_manage_title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{c.feat_manage_sub}</p>
              </div>
            </div>

            {/* IA */}
            <div className="rounded-3xl overflow-hidden relative min-h-[280px] flex flex-col justify-between p-8"
              style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #1a1040 100%)", border: "1px solid rgba(131,129,251,0.2)" }}>
              {/* Fake AI chat bubble */}
              <div className="absolute bottom-6 right-6 left-6 space-y-2 opacity-70">
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-tr-sm px-3 py-2 text-[10px] text-white/60 max-w-[160px]"
                    style={{ background: "rgba(21,61,236,0.25)", border: "1px solid rgba(21,61,236,0.2)" }}>
                    {locale === "en" ? "Generate description for blue sweater" : "Gera descrição para camisola azul"}
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-sm px-3 py-2 text-[10px] text-white/70 max-w-[200px]"
                    style={{ background: "rgba(131,129,251,0.15)", border: "1px solid rgba(131,129,251,0.2)" }}>
                    {locale === "en" ? "✨ Premium merino wool sweater, perfect for cold days..." : "✨ Camisola de lã merino premium, perfeita para os dias frios..."}
                  </div>
                </div>
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold mb-4"
                  style={{ background: "rgba(131,129,251,0.15)", color: "#c4b5fd", border: "1px solid rgba(131,129,251,0.25)" }}>
                  ✨ Claude AI
                </div>
                <h3 className="text-xl font-extrabold leading-snug mb-3">{c.feat_ai_title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{c.feat_ai_sub}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GLOBAL NETWORK ── */}
      <GlobalNetwork locale={locale} />

      {/* ── FLOW ── */}
      <section className="py-20 px-6 relative overflow-hidden"
        style={{ background: "linear-gradient(180deg,#080A12 0%,#02053D 50%,#080A12 100%)" }}>
        <div className="max-w-3xl mx-auto text-center mb-14">
          <p className="text-xs font-semibold tracking-widest text-[#8381FB] uppercase mb-3">
            {locale === "en" ? "How it works" : locale === "fr" ? "Comment ça marche" : locale === "es" ? "Cómo funciona" : "Como funciona"}
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold">{c.how_title}</h2>
          <p className="mt-3 text-white/40">{c.how_sub}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-0 max-w-2xl mx-auto">
          {FLOW.map((step, i) => (
            <div key={step.pt} className="flex items-center">
              <div className="flex flex-col items-center gap-2 group cursor-default">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 group-hover:scale-110"
                  style={{ background: "rgba(21,61,236,0.1)", border: "1px solid rgba(21,61,236,0.3)", boxShadow: "0 0 20px rgba(21,61,236,0.1)" }}>
                  {step.icon}
                </div>
                <span className="text-xs font-semibold text-white/40 group-hover:text-white transition-colors">
                  {locale === "en" ? step.en : locale === "fr" ? step.fr : locale === "es" ? step.es : step.pt}
                </span>
              </div>
              {i < FLOW.length - 1 && (
                <div className="hidden sm:flex items-center mx-3 gap-1">
                  <div className="h-px w-10 rounded-full" style={{ background: "rgba(131,129,251,0.25)" }}>
                    <div className="h-full w-1/2 rounded-full animate-glow-pulse"
                      style={{ background: "linear-gradient(90deg,#153DEC,#8381FB)", animationDelay: `${i*0.4}s` }} />
                  </div>
                  <span className="text-[#8381FB] text-xs">→</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FLOWING MENU (features showcase) ── */}
      <div style={{ height: "340px" }}>
        <FlowingMenu items={flowItems}
          bgColor="#080A12"
          marqueeBgColor="#153DFC"
          marqueeTextColor="#ffffff"
          textColor="rgba(255,255,255,0.35)"
          borderColor="rgba(21,61,236,0.15)"
          speed={12} />
      </div>

      {/* ── PLANOS ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest text-[#8381FB] uppercase mb-3">
              {locale === "en" ? "Pricing" : locale === "fr" ? "Tarifs" : locale === "es" ? "Precios" : "Preços"}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold">{c.plans_title}</h2>
            <p className="mt-3 text-white/40">{c.plans_sub}</p>
          </div>

          {/* Row 1 — Free & Starter: planos de entrada, mesmo peso visual */}
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {PLANS.slice(0, 2).map((p) => (
              <div key={p.key}
                className="rounded-3xl p-7 flex flex-col sm:flex-row sm:items-center gap-5 transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-1">{p.key}</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-extrabold text-white">{p.price}</span>
                    {p.period && <span className="text-sm text-white/30">{p.period}</span>}
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{planDesc(p)}</p>
                </div>
                <Link href="/comecar"
                  className="shrink-0 rounded-full px-6 py-2.5 text-sm font-semibold text-center transition-all hover:scale-105 whitespace-nowrap"
                  style={{ background: "rgba(21,61,236,0.15)", color: "#8381FB", border: "1px solid rgba(21,61,236,0.3)" }}>
                  {c.plans_btn}
                </Link>
              </div>
            ))}
          </div>

          {/* Row 2 — Growth & Enterprise: destaque diferenciado entre eles */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Growth — azul vibrante, badge popular */}
            <div className="relative rounded-3xl p-7 flex flex-col transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              style={{ background: "linear-gradient(145deg,#153DEC 0%,#0a2a8a 100%)", border: "1px solid rgba(21,61,236,0.7)", boxShadow: "0 0 60px rgba(21,61,236,0.25)" }}>
              {/* Glow interno */}
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-2xl opacity-20 pointer-events-none"
                style={{ background: "#8381FB" }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-blue-200 uppercase tracking-widest">{PLANS[2].key}</p>
                  <span className="rounded-full px-3 py-0.5 text-[10px] font-bold text-white"
                    style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.25)" }}>
                    {c.plans_popular}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-extrabold text-white">{PLANS[2].price}</span>
                  <span className="text-sm text-blue-200">{PLANS[2].period}</span>
                </div>
                <p className="text-sm text-blue-200 mb-6 leading-relaxed">{planDesc(PLANS[2])}</p>
                <ul className="space-y-2 mb-6">
                  {(locale === "en"
                    ? ["Unlimited products","Custom domain","API access","Claude AI included","Priority support"]
                    : locale === "fr"
                    ? ["Produits illimités","Domaine personnalisé","Accès API","Claude IA inclus","Support prioritaire"]
                    : locale === "es"
                    ? ["Productos ilimitados","Dominio propio","Acceso API","Claude IA incluida","Soporte prioritario"]
                    : ["Produtos ilimitados","Domínio próprio","Acesso a API","Claude IA incluída","Suporte prioritário"]
                  ).map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-blue-100">
                      <span className="text-green-300 text-xs">✓</span> {feat}
                    </li>
                  ))}
                </ul>
                <Link href="/comecar"
                  className="rounded-full py-3 text-sm font-semibold text-center transition-all hover:scale-105 block text-white"
                  style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)" }}>
                  {c.plans_btn}
                </Link>
              </div>
            </div>

            {/* Enterprise — dark premium, violeta sutil */}
            <div className="relative rounded-3xl p-7 flex flex-col transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              style={{ background: "linear-gradient(145deg,#12102a 0%,#0d0a20 100%)", border: "1px solid rgba(131,129,251,0.35)", boxShadow: "0 0 60px rgba(131,129,251,0.1)" }}>
              <div className="absolute top-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
                style={{ background: "#8381FB" }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-[#c4b5fd] uppercase tracking-widest">{PLANS[3].key}</p>
                  <span className="rounded-full px-3 py-0.5 text-[10px] font-bold"
                    style={{ background: "rgba(131,129,251,0.15)", color: "#c4b5fd", border: "1px solid rgba(131,129,251,0.3)" }}>
                    {locale === "en" ? "WHITE-LABEL" : locale === "fr" ? "MARQUE BLANCHE" : locale === "es" ? "MARCA PROPIA" : "WHITE-LABEL"}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-extrabold text-white">{PLANS[3].price}</span>
                  <span className="text-sm text-white/40">{PLANS[3].period}</span>
                </div>
                <p className="text-sm text-white/50 mb-6 leading-relaxed">{planDesc(PLANS[3])}</p>
                <ul className="space-y-2 mb-6">
                  {(locale === "en"
                    ? ["Everything in Growth","0% transaction fees","White-label branding","Dedicated account manager","Custom integrations"]
                    : locale === "fr"
                    ? ["Tout de Growth","0% de frais","Marque blanche","Gestionnaire dédié","Intégrations sur mesure"]
                    : locale === "es"
                    ? ["Todo de Growth","0% comisiones","Marca propia","Gestor dedicado","Integraciones a medida"]
                    : ["Tudo do Growth","0% comissão","Marca branca","Gestor dedicado","Integrações personalizadas"]
                  ).map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-white/60">
                      <span className="text-[#8381FB] text-xs">✓</span> {feat}
                    </li>
                  ))}
                </ul>
                <Link href="/comecar"
                  className="rounded-full py-3 text-sm font-semibold text-center transition-all hover:scale-105 block"
                  style={{ background: "rgba(131,129,251,0.15)", color: "#c4b5fd", border: "1px solid rgba(131,129,251,0.3)" }}>
                  {c.plans_btn}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-28 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(21,61,236,0.12) 0%, transparent 70%)" }} />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            {c.cta_title.split("?")[0]}?<br />
            <span className="text-gradient">{locale === "en" ? "Start today." : locale === "fr" ? "Commencez aujourd'hui." : locale === "es" ? "Empieza hoy." : "Comece hoje."}</span>
          </h2>
          <p className="text-white/40 text-lg mb-10">{c.cta_sub}</p>
          <Link href="/comecar"
            className="inline-flex rounded-full px-10 py-4 text-base font-semibold text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)", boxShadow: "0 0 50px rgba(21,61,236,0.5)" }}>
            {c.cta_btn}
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 py-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold">Link<span className="text-gradient">Commerce</span></span>
          <div className="flex items-center gap-6 text-xs text-white/25">
            <Link href="/entrar" className="hover:text-white transition-colors">{t("landing_cta_login", locale)}</Link>
            <Link href="/comecar" className="hover:text-white transition-colors">{t("landing_cta_start", locale)}</Link>
          </div>
          <p className="text-xs text-white/20">© {new Date().getFullYear()} LinkCommerce</p>
        </div>
      </footer>
    </div>
  );
}
