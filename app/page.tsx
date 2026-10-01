import { headers } from "next/headers";
import Link from "next/link";
import { getLocale, getLocaleCurrency, localeCurrencySymbol, t } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/landing/language-switcher";
import { PricingSection } from "@/components/landing/pricing-section";
import dynamic from "next/dynamic";

const HeroBackground = dynamic(() => import("@/components/landing/HeroBackground"), { ssr: false });
const FlowingMenu    = dynamic(() => import("@/components/landing/FlowingMenu"),    { ssr: false });

import { AngolaSection } from "@/components/landing/angola-section";
import { QuemSomosSection } from "@/components/landing/quem-somos-section";
import { TraccaoSection } from "@/components/landing/traccao-section";

export const revalidate = 3600;

/* ── SVG Icons (Lucide-style outline) ── */
const IconStore  = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const IconPos    = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="8" x2="16" y1="10" y2="10"/><line x1="8" x2="12" y1="14" y2="14"/></svg>;
const IconChart  = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/><line x1="2" x2="22" y1="20" y2="20"/></svg>;
const IconAI     = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a5 5 0 1 0 5 5"/><path d="M12 2v3"/><path d="M12 22v-3"/><path d="m4.22 4.22 2.12 2.12"/><path d="m17.66 17.66 2.12 2.12"/><path d="M2 12h3"/><path d="M19 12h3"/><path d="m4.22 19.78 2.12-2.12"/><path d="m17.66 6.34 2.12-2.12"/></svg>;

/* Flow step icons */
const IconBox    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>;
const IconCart   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>;
const IconCard   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>;
const IconClip   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/></svg>;
const IconTruck  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect width="7" height="7" x="14" y="11" rx="1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>;

const FEATURES = [
  {
    icon: <IconStore />,
    color: "#153DEC",
    badge: "Loja Online",
    pt: { title: "A sua loja na internet", sub: "Crie a sua loja com subdomínio próprio, catálogo de produtos, carrinho e pagamentos — tudo pronto a usar." },
    en: { title: "Your store online", sub: "Launch your store with your own subdomain, product catalogue, cart and payments — ready to use." },
    fr: { title: "Votre boutique en ligne", sub: "Créez votre boutique avec sous-domaine, catalogue, panier et paiements — prêt à l'emploi." },
    es: { title: "Tu tienda en internet", sub: "Crea tu tienda con subdominio propio, catálogo de productos, carrito y pagos — todo listo." },
  },
  {
    icon: <IconPos />,
    color: "#8381FB",
    badge: "POS",
    pt: { title: "Venda presencial", sub: "Registe vendas na loja física e sincronize o stock com a sua loja online a partir do mesmo painel." },
    en: { title: "In-store sales", sub: "Log sales at your physical store and sync stock with your online store from the same panel." },
    fr: { title: "Ventes en magasin", sub: "Enregistrez les ventes en boutique et synchronisez le stock avec votre boutique en ligne." },
    es: { title: "Ventas presenciales", sub: "Registra ventas en tu tienda física y sincroniza el stock con tu tienda online." },
  },
  {
    icon: <IconChart />,
    color: "#153DEC",
    badge: "Analytics",
    pt: { title: "Gestão em tempo real", sub: "Produtos, pedidos, clientes e stock — tudo integrado e acessível a qualquer hora." },
    en: { title: "Real-time management", sub: "Products, orders, customers and stock — all integrated and accessible anytime." },
    fr: { title: "Gestion en temps réel", sub: "Produits, commandes, clients et stock — tout intégré et accessible à tout moment." },
    es: { title: "Gestión en tiempo real", sub: "Productos, pedidos, clientes y stock — todo integrado y accesible en cualquier momento." },
  },
  {
    icon: <IconAI />,
    color: "#8381FB",
    badge: "Claude AI",
    pt: { title: "IA que trabalha por si", sub: "Gere descrições de produto e sugestões de preço com Claude — directamente no dashboard." },
    en: { title: "AI that works for you", sub: "Generate product descriptions and price suggestions with Claude — directly in the dashboard." },
    fr: { title: "IA qui travaille pour vous", sub: "Générez des descriptions de produits et des suggestions de prix avec Claude." },
    es: { title: "IA que trabaja por ti", sub: "Genera descripciones de producto y sugerencias de precio con Claude — desde el panel." },
  },
];

const FLOW = [
  { icon: <IconBox />,   pt: "Produto",   en: "Product",  fr: "Produit",  es: "Producto"  },
  { icon: <IconCart />,  pt: "Carrinho",  en: "Cart",     fr: "Panier",   es: "Carrito"   },
  { icon: <IconCard />,  pt: "Pagamento", en: "Payment",  fr: "Paiement", es: "Pago"      },
  { icon: <IconClip />,  pt: "Pedido",    en: "Order",    fr: "Commande", es: "Pedido"    },
  { icon: <IconTruck />, pt: "Entrega",   en: "Delivery", fr: "Livraison",es: "Entrega"   },
];

export default async function HomePage() {
  const locale = getLocale();
  const sym = localeCurrencySymbol(locale);
  const cur = getLocaleCurrency(locale);

  const hdrs = await headers();
  const geoOverride = hdrs.get("x-geo-override");
  const country = geoOverride ?? hdrs.get("x-vercel-ip-country") ?? (cur === "AOA" ? "AO" : "XX");
  const isAngola = country === "AO";

  const flowItems = [
    { link:"/comecar", text: locale==="en"?"Online Store":locale==="fr"?"Boutique en ligne":locale==="es"?"Tienda online":"Loja Online",   image:"https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=200&fit=crop" },
    { link:"/comecar", text: locale==="en"?"Point of Sale":locale==="fr"?"Point de vente":locale==="es"?"Punto de venta":"Ponto de Venda", image:"https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop" },
    { link:"/comecar", text: locale==="en"?"Analytics":locale==="fr"?"Analytique":locale==="es"?"Análisis":"Analytics",                    image:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop" },
  ];

  const howLabel = locale==="en"?"How it works":locale==="fr"?"Comment ça marche":locale==="es"?"Cómo funciona":"Como funciona";
  const howTitle = locale==="en"?"From product to customer":locale==="fr"?"Du produit au client":locale==="es"?"Del producto al cliente":"Do produto ao cliente";
  const howSub   = locale==="en"?"Every step of your business, integrated and automated.":locale==="fr"?"Chaque étape de votre entreprise, intégrée et automatisée.":locale==="es"?"Cada paso de tu negocio, integrado y automatizado.":"Cada passo do seu negócio, integrado e automatizado.";
  const ctaTitle = locale==="en"?"Ready to open your store?":locale==="fr"?"Prêt à ouvrir votre boutique ?":locale==="es"?"¿Listo para abrir tu tienda?":"Pronto para abrir a sua loja?";
  const ctaSub   = locale==="en"?"Create your store in minutes. No hidden commissions.":locale==="fr"?"Créez votre boutique en minutes. Sans commissions cachées.":locale==="es"?"Crea tu tienda en minutos. Sin comisiones ocultas.":"Crie a sua loja em minutos. Sem comissões escondidas.";
  const ctaBtn   = locale==="en"?"Create my store →":locale==="fr"?"Créer ma boutique →":locale==="es"?"Crear mi tienda →":"Criar a minha loja →";
  const featLabel= locale==="en"?"Features":locale==="fr"?"Fonctionnalités":locale==="es"?"Funciones":"Funcionalidades";
  const pricLabel= locale==="en"?"Pricing":locale==="fr"?"Tarifs":locale==="es"?"Precios":"Preços";
  const aboutLabel=locale==="en"?"About Us":locale==="fr"?"À propos":locale==="es"?"Quiénes somos":"Quem Somos";
  const loginLabel=t("landing_cta_login", locale);
  const startLabel=t("landing_cta_start", locale);

  return (
    <div className="bg-[#080A12] text-white font-montserrat overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 px-6 py-4"
        style={{ background:"rgba(8,10,18,0.88)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            Link<span className="text-gradient">Commerce</span>
          </Link>
          <div className="hidden md:flex items-center gap-1 text-sm">
            {[
              { href:"#funcionalidades", label:featLabel },
              { href:"#angola", label:"Angola" },
              { href:"#precos", label:pricLabel },
              { href:"#quem-somos", label:aboutLabel },
            ].map(l => (
              <a key={l.href} href={l.href} className="px-3 py-2 text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher current={locale} />
            <Link href="/entrar" className="text-sm font-medium text-white/55 hover:text-white transition-colors px-3 py-2">
              {loginLabel}
            </Link>
            <Link href="/comecar"
              className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-all hover:scale-105 hover:opacity-90"
              style={{ background:"linear-gradient(135deg,#153DEC,#8381FB)", boxShadow:"0 0 20px rgba(21,61,236,0.4)" }}>
              {startLabel}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative px-6 pt-32 pb-0 overflow-hidden">
        <HeroBackground />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:"linear-gradient(180deg,rgba(8,10,18,0.4) 0%,rgba(8,10,18,0.0) 50%,rgba(8,10,18,1) 100%)" }} />

        <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-end">
          {/* ── Left: Copy ── */}
          <div className="pb-16 lg:pb-24">
            {/* Badge */}
            <div className="mb-7">
              <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
                style={{ background:"rgba(21,61,236,0.15)", border:"1px solid rgba(21,61,236,0.3)", color:"#a5b4fc" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#8381FB] animate-pulse inline-block" />
                {locale==="en"?"E-commerce platform for Angola":locale==="fr"?"Plateforme e-commerce pour l'Angola":locale==="es"?"Plataforma e-commerce para Angola":"Plataforma de e-commerce para Angola"}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-[68px] font-extrabold leading-[1.05] mb-6 tracking-tight">
              {t("landing_h1a", locale)}<br />
              <span className="text-gradient">{t("landing_h1b", locale)}</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/45 mb-10 leading-relaxed max-w-lg">
              {t("landing_sub", locale)}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-12">
              <Link href="/comecar"
                className="rounded-full px-9 py-3.5 text-base font-semibold text-white transition-all hover:scale-105"
                style={{ background:"linear-gradient(135deg,#153DEC,#8381FB)", boxShadow:"0 0 36px rgba(21,61,236,0.55)" }}>
                {ctaBtn}
              </Link>
              <Link href="/entrar"
                className="rounded-full px-9 py-3.5 text-base font-medium text-white/55 border transition-all hover:border-white/25 hover:text-white"
                style={{ borderColor:"rgba(255,255,255,0.1)" }}>
                {loginLabel}
              </Link>
            </div>

            {/* Social proof strip */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[11px] text-white/25 font-medium uppercase tracking-widest">
                {locale==="en"?"Trusted by":"Utilizado por"}
              </span>
              {["Luanda", "Benguela", "Huambo", "Cabinda", "Malanje"].map(city => (
                <span key={city} className="text-[11px] font-semibold text-white/30 px-3 py-1 rounded-full"
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  {city}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right: Browser mockup ── */}
          <div className="lg:translate-y-8">
            <div className="rounded-t-2xl overflow-hidden"
              style={{ background:"rgba(10,14,30,0.9)", border:"1px solid rgba(255,255,255,0.08)", borderBottom:"none", boxShadow:"0 -20px 80px rgba(21,61,236,0.08), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background:"rgba(255,255,255,0.1)" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background:"rgba(255,255,255,0.1)" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background:"rgba(255,255,255,0.1)" }} />
                </div>
                <div className="flex-1 mx-4 rounded-md px-3 py-1 text-[11px] text-white/20 text-center"
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)" }}>
                  linkcommerce.cc/dashboard
                </div>
              </div>
              {/* Dashboard content */}
              <div className="p-5 grid grid-cols-3 gap-3">
                {[
                  { label:locale==="en"?"Revenue":locale==="fr"?"Revenus":"Receita", val:cur==="AOA"?`245.000 ${sym}`:`${sym}245` },
                  { label:locale==="en"?"Orders":locale==="fr"?"Commandes":"Pedidos", val:"38" },
                  { label:locale==="en"?"Customers":locale==="fr"?"Clients":"Clientes", val:"124" },
                ].map((k,i) => (
                  <div key={i} className="rounded-xl p-3.5" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[10px] text-white/30 mb-1.5">{k.label}</p>
                    <p className="text-base font-bold text-white">{k.val}</p>
                    <p className="text-[10px] text-green-400 mt-1">↑ 12%</p>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5 space-y-2">
                {[
                  { name:"Maria A.", prod:locale==="en"?"Blue Dress":locale==="fr"?"Robe Bleue":"Vestido Azul", val:cur==="AOA"?`8.900 ${sym}`:`${sym}8,90`, status:"delivered" },
                  { name:"João M.", prod:locale==="en"?"Black Sneakers":locale==="fr"?"Baskets Noires":"Ténis Preto", val:cur==="AOA"?`12.500 ${sym}`:`${sym}12,50`, status:"processing" },
                  { name:"Ana S.", prod:locale==="en"?"Handbag":locale==="fr"?"Sac à main":"Mala de mão", val:cur==="AOA"?`6.200 ${sym}`:`${sym}6,20`, status:"pending" },
                ].map((o,i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2.5"
                    style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ background:"rgba(21,61,236,0.2)", color:"#8381FB" }}>{o.name[0]}</div>
                      <div>
                        <p className="text-[11px] font-medium text-white">{o.name}</p>
                        <p className="text-[10px] text-white/30">{o.prod}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-white/70">{o.val}</span>
                      <span className="text-[9px] font-bold rounded-full px-2 py-0.5"
                        style={{
                          background: o.status==="delivered"?"rgba(34,197,94,0.15)":o.status==="processing"?"rgba(21,61,236,0.15)":"rgba(234,179,8,0.15)",
                          color: o.status==="delivered"?"#4ade80":o.status==="processing"?"#a5b4fc":"#fbbf24"
                        }}>
                        {o.status==="delivered"?locale==="en"?"Delivered":locale==="fr"?"Livré":"Entregue":o.status==="processing"?locale==="en"?"Processing":locale==="fr"?"En cours":"Em curso":locale==="en"?"Pending":locale==="fr"?"En attente":"Pendente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRAÇÃO ── */}
      <TraccaoSection locale={locale} />

      {/* ── FEATURES — bento grid com mockups ── */}
      <section id="funcionalidades" className="py-24 px-6" style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 max-w-2xl">
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color:"#8381FB" }}>{featLabel}</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight">
              {locale==="en"?"Everything you need to sell":locale==="fr"?"Tout ce dont vous avez besoin":locale==="es"?"Todo lo que necesitas para vender":"Tudo o que precisas para vender"}
            </h2>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">

            {/* Card 1 — Loja Online (grande) */}
            <div className="col-span-2 lg:col-span-2 rounded-2xl overflow-hidden relative"
              style={{ background:"rgba(21,61,236,0.08)", border:"1px solid rgba(21,61,236,0.2)", minHeight:"280px" }}>
              <div className="p-7 pb-0 relative z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold mb-4"
                  style={{ background:"rgba(21,61,236,0.2)", border:"1px solid rgba(21,61,236,0.3)", color:"#a5b4fc" }}>
                  🛍 {locale==="en"?"Online Store":locale==="fr"?"Boutique":"Loja Online"}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {locale==="en"?"Your store online":locale==="fr"?"Votre boutique en ligne":"A sua loja na internet"}
                </h3>
                <p className="text-sm text-white/40 max-w-xs">
                  {locale==="en"?"Subdomain, product catalogue, cart and payments — ready to use.":locale==="fr"?"Sous-domaine, catalogue, panier et paiements — prêt à l'emploi.":"Subdomínio próprio, catálogo de produtos, carrinho e pagamentos — tudo pronto a usar."}
                </p>
              </div>
              {/* Mini product list mockup */}
              <div className="absolute bottom-0 right-0 w-48 sm:w-64 p-4 space-y-2">
                {[{p:"Camisola Merino", v: cur==="AOA"?`89.000 ${sym}`:`${sym}89`},{p:"Calças Linho", v:cur==="AOA"?`124.000 ${sym}`:`${sym}124`},{p:"Boné Algodão", v:cur==="AOA"?`45.000 ${sym}`:`${sym}45`}].map((i,k)=>(
                  <div key={k} className="flex items-center gap-2.5 rounded-lg px-3 py-2"
                    style={{ background:"rgba(10,14,30,0.7)", border:"1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-6 h-6 rounded-md flex-shrink-0" style={{ background:"rgba(21,61,236,0.3)" }} />
                    <span className="text-[10px] text-white/60 flex-1 truncate">{i.p}</span>
                    <span className="text-[10px] font-bold text-white">{i.v}</span>
                  </div>
                ))}
                <div className="rounded-lg px-3 py-1.5 text-center text-[10px] font-bold text-white mt-1"
                  style={{ background:"linear-gradient(135deg,#153DEC,#8381FB)" }}>
                  linkcommerce.cc/loja
                </div>
              </div>
            </div>

            {/* Card 2 — POS */}
            <div className="rounded-2xl overflow-hidden relative"
              style={{ background:"rgba(131,129,251,0.07)", border:"1px solid rgba(131,129,251,0.2)", minHeight:"280px" }}>
              <div className="p-6 pb-0">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold mb-4"
                  style={{ background:"rgba(131,129,251,0.15)", border:"1px solid rgba(131,129,251,0.25)", color:"#c4b5fd" }}>
                  ↗ POS
                </span>
                <h3 className="text-lg font-bold text-white mb-2">
                  {locale==="en"?"In-store sales":locale==="fr"?"Ventes en magasin":"Venda presencialmente"}
                </h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  {locale==="en"?"POS for physical stores. Sync stock with your online store.":locale==="fr"?"POS pour les commerces physiques. Synchronisez le stock avec votre boutique.":"POS para lojas físicas. Registe vendas presenciais e sincronize o stock com a loja online."}
                </p>
              </div>
              {/* POS mockup */}
              <div className="absolute bottom-4 right-4 w-32">
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {[...Array(4)].map((_,i)=>(
                    <div key={i} className="aspect-square rounded-lg" style={{ background:"rgba(131,129,251,0.15)", border:"1px solid rgba(131,129,251,0.2)" }} />
                  ))}
                </div>
                <div className="rounded-lg py-1.5 text-center text-[10px] font-bold text-white"
                  style={{ background:"rgba(131,129,251,0.4)" }}>
                  {locale==="en"?"Confirm":"Confirmar"}
                </div>
              </div>
            </div>

            {/* Card 3 — Analytics */}
            <div className="rounded-2xl overflow-hidden relative"
              style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", minHeight:"240px" }}>
              <div className="p-6 pb-0">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold mb-4"
                  style={{ background:"rgba(21,61,236,0.15)", border:"1px solid rgba(21,61,236,0.25)", color:"#a5b4fc" }}>
                  📊 Analytics
                </span>
                <h3 className="text-lg font-bold text-white mb-2">
                  {locale==="en"?"Real-time management":locale==="fr"?"Gestion en temps réel":"Gestão completa"}
                </h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  {locale==="en"?"Products, orders, customers and stock.":locale==="fr"?"Produits, commandes, clients et stock.":"Produtos, pedidos, clientes e stock — tudo integrado e acessível em tempo real."}
                </p>
              </div>
              {/* Chart mockup */}
              <div className="absolute bottom-4 right-4 flex items-end gap-1">
                {[30,50,35,65,45,80,100].map((h,i)=>(
                  <div key={i} className="w-4 rounded-t-md"
                    style={{ height:`${h * 0.7}px`, background: i===6?"linear-gradient(to top,#153DEC,#8381FB)":"rgba(131,129,251,0.2)" }} />
                ))}
              </div>
            </div>

            {/* Card 4 — IA */}
            <div className="col-span-2 lg:col-span-2 rounded-2xl overflow-hidden relative"
              style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", minHeight:"240px" }}>
              <div className="p-6 relative z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold mb-4"
                  style={{ background:"rgba(131,129,251,0.15)", border:"1px solid rgba(131,129,251,0.25)", color:"#c4b5fd" }}>
                  ✦ Claude AI
                </span>
                <h3 className="text-lg font-bold text-white mb-2">
                  {locale==="en"?"AI that works for you":locale==="fr"?"IA qui travaille pour vous":"IA integrada"}
                </h3>
                <p className="text-xs text-white/40 max-w-xs leading-relaxed">
                  {locale==="en"?"Generate product descriptions and price suggestions with Claude.":locale==="fr"?"Générez des descriptions et suggestions de prix avec Claude.":"Gere descrições de produto e sugestões de preço com Claude."}
                </p>
              </div>
              {/* AI chat bubbles */}
              <div className="absolute bottom-4 right-4 sm:right-8 space-y-2 max-w-[200px]">
                <div className="rounded-xl rounded-tr-none px-3 py-2 text-[10px] text-white/60 text-right"
                  style={{ background:"rgba(131,129,251,0.15)", border:"1px solid rgba(131,129,251,0.2)" }}>
                  {locale==="en"?"Generate description for blue shirt":locale==="fr"?"Générer description chemise bleue":"Gera descrição para camisola azul"}
                </div>
                <div className="rounded-xl rounded-tl-none px-3 py-2 text-[10px] text-white/70"
                  style={{ background:"rgba(21,61,236,0.15)", border:"1px solid rgba(21,61,236,0.2)" }}>
                  ✦ {locale==="en"?"Merino wool shirt, perfect for cold days…":locale==="fr"?"Chemise en laine mérinos, parfaite pour…":"Camisola de lã merino premium, perfeita para os dias frios…"}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── TEMAS DA LOJA ── */}
      <section className="py-24 px-6" style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 max-w-2xl">
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color:"#8381FB" }}>
              {locale==="en"?"Themes":locale==="fr"?"Thèmes":locale==="es"?"Temas":"Temas"}
            </p>
            <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight">
              {locale==="en"?"A theme for every business":locale==="fr"?"Un thème pour chaque commerce":locale==="es"?"Un tema para cada negocio":"Um tema para cada negócio"}
            </h2>
            <p className="mt-4 text-white/40 text-lg">
              {locale==="en"?"Choose the look that fits your niche. Change it anytime.":locale==="fr"?"Choisissez le look qui correspond à votre secteur.":"Escolhe o look que melhor representa o teu negócio. Muda quando quiseres."}
            </p>
          </div>

          {/* Bento de temas */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Tema Moda — grande */}
            <div className="col-span-2 lg:col-span-1 row-span-2 rounded-2xl overflow-hidden relative group"
              style={{ background:"#0e0e0e", border:"1px solid rgba(255,255,255,0.08)", minHeight:"380px" }}>
              <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=800&fit=crop&q=80"
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity duration-500" alt="Tema Moda" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="inline-block rounded-full px-2.5 py-1 text-[10px] font-bold mb-3"
                  style={{ background:"rgba(255,255,255,0.15)", color:"#fff" }}>Moda</span>
                <h3 className="text-xl font-bold text-white mb-1">Tema Moda</h3>
                <p className="text-xs text-white/50">Hero editorial, lookbook, coleções e variantes de tamanho.</p>
                <span className="mt-3 inline-block text-[10px] font-bold text-white/30 uppercase tracking-widest">Grátis</span>
              </div>
            </div>

            {/* Tema Jóia */}
            <div className="rounded-2xl overflow-hidden relative group"
              style={{ background:"#0a0a08", border:"1px solid rgba(197,162,83,0.2)", minHeight:"180px" }}>
              <img src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop&q=80"
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-65 transition-opacity duration-500" alt="Tema Joalharia" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="inline-block rounded-full px-2.5 py-1 text-[10px] font-bold mb-2"
                  style={{ background:"rgba(197,162,83,0.2)", color:"#C5A253", border:"1px solid rgba(197,162,83,0.3)" }}>Joalharia</span>
                <h3 className="text-base font-bold text-white">Tema Jóia</h3>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-white/40">Luxury escuro, configurador</p>
                  <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-amber-400/20 text-amber-400">Pro</span>
                </div>
              </div>
            </div>

            {/* Tema Casa */}
            <div className="rounded-2xl overflow-hidden relative group"
              style={{ background:"#0d0a08", border:"1px solid rgba(92,74,58,0.3)", minHeight:"180px" }}>
              <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop&q=80"
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-65 transition-opacity duration-500" alt="Tema Casa" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="inline-block rounded-full px-2.5 py-1 text-[10px] font-bold mb-2"
                  style={{ background:"rgba(92,74,58,0.3)", color:"#c8a882", border:"1px solid rgba(92,74,58,0.4)" }}>Mobiliário</span>
                <h3 className="text-base font-bold text-white">Tema Casa</h3>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-white/40">Ambiente, configurador</p>
                  <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-amber-400/20 text-amber-400">Pro</span>
                </div>
              </div>
            </div>

            {/* Tema Gourmet */}
            <div className="rounded-2xl overflow-hidden relative group"
              style={{ background:"#0f0805", border:"1px solid rgba(139,37,0,0.3)", minHeight:"180px" }}>
              <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&q=80"
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-65 transition-opacity duration-500" alt="Tema Gourmet" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="inline-block rounded-full px-2.5 py-1 text-[10px] font-bold mb-2"
                  style={{ background:"rgba(139,37,0,0.25)", color:"#f87171", border:"1px solid rgba(139,37,0,0.4)" }}>Restaurante</span>
                <h3 className="text-base font-bold text-white">Tema Gourmet</h3>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-white/40">Menu visual, reservas</p>
                  <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-amber-400/20 text-amber-400">Pro</span>
                </div>
              </div>
            </div>

            {/* Tema Beleza */}
            <div className="rounded-2xl overflow-hidden relative group"
              style={{ background:"#100810", border:"1px solid rgba(196,116,138,0.2)", minHeight:"180px" }}>
              <img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=300&fit=crop&q=80"
                className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-60 transition-opacity duration-500" alt="Tema Beleza" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="inline-block rounded-full px-2.5 py-1 text-[10px] font-bold mb-2"
                  style={{ background:"rgba(196,116,138,0.2)", color:"#f0abbc", border:"1px solid rgba(196,116,138,0.3)" }}>Beleza</span>
                <h3 className="text-base font-bold text-white">Tema Beleza</h3>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-white/40">Editorial, kits, rotinas</p>
                  <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-amber-400/20 text-amber-400">Pro</span>
                </div>
              </div>
            </div>

          </div>

          {/* CTA para ver todos */}
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-white/30">
              {locale==="en"?"8 themes available · More coming soon":locale==="fr"?"8 thèmes disponibles · D'autres arrivent bientôt":"8 temas disponíveis · Mais em breve"}
            </p>
            <Link href="/comecar"
              className="text-sm font-semibold text-white/60 hover:text-white transition-colors">
              {locale==="en"?"See all themes →":locale==="fr"?"Voir tous les thèmes →":"Ver todos os temas →"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── ANGOLA ── */}
      <div id="angola"><AngolaSection /></div>

      {/* ── COMO FUNCIONA ── */}
      <section className="py-24 px-6 relative overflow-hidden"
        style={{ background:"linear-gradient(180deg,#080A12 0%,#02053D 50%,#080A12 100%)" }}>
        <div className="max-w-6xl mx-auto mb-14">
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color:"#8381FB" }}>{howLabel}</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold max-w-xl">{howTitle}</h2>
          <p className="mt-4 text-white/40 text-lg max-w-lg">{howSub}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-0 max-w-6xl mx-auto">
          {FLOW.map((step, i) => (
            <div key={step.pt} className="flex items-center">
              <div className="flex flex-col items-center gap-3 group cursor-default">
                <div className="h-14 w-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ background:"rgba(21,61,236,0.1)", border:"1px solid rgba(21,61,236,0.25)", color:"#8381FB", boxShadow:"0 0 16px rgba(21,61,236,0.1)" }}>
                  {step.icon}
                </div>
                <span className="text-[11px] font-semibold text-white/35 group-hover:text-white transition-colors">
                  {(step as unknown as Record<string, string>)[locale] ?? step.pt}
                </span>
              </div>
              {i < FLOW.length - 1 && (
                <div className="hidden sm:flex items-center mx-4">
                  <svg width="32" height="2" viewBox="0 0 32 2">
                    <line x1="0" y1="1" x2="26" y2="1" stroke="rgba(131,129,251,0.25)" strokeWidth="1.5" strokeDasharray="3 2" />
                    <polyline points="24,−3 30,1 24,5" fill="none" stroke="rgba(131,129,251,0.4)" strokeWidth="1.2" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FLOWING MENU ── */}
      <div style={{ height:"320px" }}>
        <FlowingMenu items={flowItems}
          bgColor="#080A12"
          marqueeBgColor="#153DFC"
          marqueeTextColor="#ffffff"
          textColor="rgba(255,255,255,0.35)"
          borderColor="rgba(21,61,236,0.15)"
          speed={12} />
      </div>

      {/* ── PLANOS ── */}
      <section id="precos" className="py-24 px-6">
        <PricingSection locale={locale} isAngola={isAngola} />
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:"radial-gradient(ellipse at 50% 50%, rgba(21,61,236,0.1) 0%, transparent 65%)" }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-5 leading-tight">
            {ctaTitle.split("?")[0]}?<br />
            <span className="text-gradient">{locale==="en"?"Start today.":locale==="fr"?"Commencez aujourd'hui.":locale==="es"?"Empieza hoy.":"Comece hoje."}</span>
          </h2>
          <p className="text-white/40 text-lg mb-10">{ctaSub}</p>
          <Link href="/comecar"
            className="inline-flex rounded-full px-10 py-4 text-base font-semibold text-white transition-all hover:scale-105"
            style={{ background:"linear-gradient(135deg,#153DEC,#8381FB)", boxShadow:"0 0 50px rgba(21,61,236,0.45)" }}>
            {ctaBtn}
          </Link>
        </div>
      </section>

      <div id="quem-somos"><QuemSomosSection /></div>

      {/* ── FOOTER ── */}
      <footer className="px-6 py-10" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold">Link<span className="text-gradient">Commerce</span></span>
          <div className="flex items-center gap-6 text-xs text-white/25">
            <Link href="/entrar" className="hover:text-white transition-colors">{loginLabel}</Link>
            <Link href="/comecar" className="hover:text-white transition-colors">{startLabel}</Link>
            <Link href="/termos" className="hover:text-white transition-colors">Termos</Link>
            <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
            <a href="mailto:suporte@linkcommerce.cc" className="hover:text-white transition-colors">
              {locale==="en"?"Contact":locale==="fr"?"Contact":"Contacto"}
            </a>
          </div>
          <p className="text-xs text-white/20">© {new Date().getFullYear()} LinkCommerce</p>
        </div>
      </footer>
    </div>
  );
}
