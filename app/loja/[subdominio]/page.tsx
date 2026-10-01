import { notFound } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { StoreTracker } from "@/components/storefront/store-tracker";
import { StorefrontGrid } from "@/components/storefront/storefront-grid";
import { getLocale, t } from "@/lib/i18n";
import { getTema } from "@/lib/temas";

interface PageProps {
  params: { subdominio: string };
  searchParams?: { q?: string };
}

async function getLojaComProdutos(subdominio: string) {
  return prisma.loja.findUnique({
    where: { subdominio },
    select: {
      id: true, nome: true, moeda: true, corPrimaria: true, logotipoUrl: true, tema: true,
      produtos: {
        where: { ativo: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, titulo: true, descricao: true,
          preco: true, imagemUrl: true, stock: true,
          variantes: { select: { id: true, nomeOpcao: true, precoExtra: true, stock: true } },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps) {
  const loja = await prisma.loja.findUnique({
    where: { subdominio: params.subdominio },
    select: { nome: true, logotipoUrl: true, seoTitulo: true, seoDescricao: true },
  });
  if (!loja) return {};
  const url = `https://${params.subdominio}.linkcommerce.cc`;
  const title = loja.seoTitulo ?? loja.nome;
  const desc = loja.seoDescricao ?? `Compre online na ${loja.nome}. Entrega rápida e pagamento seguro.`;
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url,
      siteName: loja.nome,
      type: "website",
      images: loja.logotipoUrl ? [{ url: loja.logotipoUrl, width: 400, height: 400 }] : [],
    },
    twitter: { card: "summary", title, description: desc },
    metadataBase: new URL(url),
  };
}


export default async function StorefrontPage({ params, searchParams }: PageProps) {
  const loja = await getLojaComProdutos(params.subdominio);
  if (!loja) notFound();

  const locale = getLocale();
  const moeda = loja.moeda ?? "EUR";
  const temaConfig = getTema(loja.tema ?? "essencial");
  const cor = temaConfig.cor || loja.corPrimaria || "#153DFC";
  const temaSlug = temaConfig.slug;
  const initialQuery = searchParams?.q?.trim() ?? "";

  // Estilos visuais por tema — alinhados com os nichos reais da plataforma
  const temaStyles: Record<string, { heroBg: string; heroText: string; pageBg: string; cardBg: string; cardText: string }> = {
    essencial:   { heroBg: `linear-gradient(135deg, ${cor}18 0%, ${cor}08 50%, transparent)`, heroText: "text-slate-900", pageBg: "bg-white",       cardBg: "bg-white",        cardText: "text-slate-900"  },
    moda:        { heroBg: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",               heroText: "text-white",      pageBg: "bg-[#111]",       cardBg: "bg-[#1a1a1a]",    cardText: "text-white"      },
    beleza:      { heroBg: "linear-gradient(135deg, #fff5f7 0%, #fce4ea 100%)",               heroText: "text-rose-900",   pageBg: "bg-[#fff8fa]",    cardBg: "bg-white",        cardText: "text-rose-900"   },
    gourmet:     { heroBg: "linear-gradient(135deg, #fff8f0 0%, #fde8d8 100%)",               heroText: "text-stone-900",  pageBg: "bg-[#fdf5ee]",    cardBg: "bg-white",        cardText: "text-stone-900"  },
    calcado:     { heroBg: "linear-gradient(135deg, #1C2B3A 0%, #2e3f52 100%)",               heroText: "text-white",      pageBg: "bg-[#141f2a]",    cardBg: "bg-[#1C2B3A]",    cardText: "text-slate-100"  },
    electronica: { heroBg: "linear-gradient(135deg, #001833 0%, #002a5c 100%)",               heroText: "text-blue-100",   pageBg: "bg-[#000d1a]",    cardBg: "bg-[#001223]",    cardText: "text-blue-100"   },
    artesanato:  { heroBg: "linear-gradient(135deg, #fdf3e7 0%, #f5e3c8 100%)",               heroText: "text-amber-900",  pageBg: "bg-[#fdf6ec]",    cardBg: "bg-white",        cardText: "text-amber-900"  },
    servicos:    { heroBg: "linear-gradient(135deg, #f0f4ff 0%, #dce6ff 100%)",               heroText: "text-slate-800",  pageBg: "bg-[#f5f7ff]",    cardBg: "bg-white",        cardText: "text-slate-800"  },
  };
  const ts = temaStyles[temaSlug] ?? temaStyles.essencial;

  const jsonLdOrg = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: loja.nome,
    url: `https://${params.subdominio}.linkcommerce.cc`,
    ...(loja.logotipoUrl && { logo: loja.logotipoUrl }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
      />
      {/* Tracker de visita real — client-side, filtra bots no servidor */}
      <StoreTracker lojaId={loja.id} />

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden py-20 px-4"
        style={{ background: ts.heroBg, borderBottom: `1px solid ${cor}20` }}
      >
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${cor}, transparent 70%)` }} />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-8"
          style={{ background: `radial-gradient(circle, ${cor}, transparent 70%)` }} />

        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl font-black text-3xl text-white mb-5 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${cor}, ${cor}bb)` }}>
            {loja.logotipoUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={loja.logotipoUrl} alt={loja.nome} className="w-full h-full object-cover rounded-2xl" />
              : loja.nome.charAt(0).toUpperCase()}
          </div>
          <h1 className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${ts.heroText}`}>{loja.nome}</h1>
          <p className={`mt-3 text-lg opacity-60 ${ts.heroText}`}>
            {loja.produtos.length} {loja.produtos.length !== 1
              ? t("store_products_label", locale)
              : t("store_product_label", locale)}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
            style={{ background: `${cor}25`, color: cor, border: `1px solid ${cor}40` }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: cor }} />
            {t("store_open_badge", locale)}
          </div>
        </div>
      </section>

      {/* ── Produtos ── */}
      <div className={`${ts.pageBg} min-h-screen`}>
      <section className="max-w-6xl mx-auto px-4 py-12">
        {loja.produtos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="text-6xl mb-6">🛍️</div>
            <h2 className="text-2xl font-bold text-slate-800">{t("store_coming_soon", locale)}</h2>
            <p className="mt-2 text-slate-400">{t("store_coming_soon_sub", locale)}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {t("store_all_products", locale)}
                <span className="ml-2 text-sm font-normal text-slate-400">({loja.produtos.length})</span>
              </h2>
            </div>
            <Suspense fallback={null}>
              <StorefrontGrid
                produtos={loja.produtos.map((p) => ({
                  ...p,
                  preco: Number(p.preco),
                  variantes: p.variantes.map((v) => ({ ...v, precoExtra: Number(v.precoExtra) })),
                }))}
                subdominio={params.subdominio}
                moeda={moeda}
                corPrimaria={cor}
                tema={temaSlug}
                cardBg={ts.cardBg}
                cardText={ts.cardText}
                initialQuery={initialQuery}
                locale={locale}
                outOfStockLabel={t("store_out_of_stock", locale)}
                lastUnitsLabel={t("store_last_units", locale)}
              />
            </Suspense>
          </>
        )}
      </section>

      {/* ── Trust badges ── */}
      <section className="border-y py-10 px-4 mt-4 opacity-80"
        style={{ background: `${cor}08`, borderColor: `${cor}15` }}>
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: "🚚", title: t("store_trust_1_title", locale), sub: t("store_trust_1_sub", locale) },
            { icon: "🔒", title: t("store_trust_2_title", locale), sub: t("store_trust_2_sub", locale) },
            { icon: "↩️", title: t("store_trust_3_title", locale), sub: t("store_trust_3_sub", locale) },
          ].map(item => (
            <div key={item.title} className={`flex flex-col items-center gap-2 ${ts.cardText}`}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: `${cor}20` }}>
                {item.icon}
              </div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-xs opacity-60">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>
      </div>

    </>
  );
}
