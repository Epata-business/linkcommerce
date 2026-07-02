import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { formatarPreco } from "@/lib/moeda";
import { getLocale, t } from "@/lib/i18n";

interface PageProps { params: { subdominio: string } }

async function getLojaComProdutos(subdominio: string) {
  return prisma.loja.findUnique({
    where: { subdominio },
    include: {
      produtos: {
        where: { ativo: true },
        orderBy: { createdAt: "desc" },
        include: { variantes: true },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps) {
  const loja = await prisma.loja.findUnique({ where: { subdominio: params.subdominio } });
  if (!loja) return {};
  const url = `https://${params.subdominio}.linkcommerce.app`;
  const desc = `Compre online na ${loja.nome}. Entrega rápida e pagamento seguro.`;
  return {
    title: loja.nome,
    description: desc,
    openGraph: {
      title: loja.nome,
      description: desc,
      url,
      siteName: loja.nome,
      type: "website",
      images: loja.logotipoUrl ? [{ url: loja.logotipoUrl, width: 400, height: 400 }] : [],
    },
    twitter: { card: "summary", title: loja.nome, description: desc },
    metadataBase: new URL(url),
  };
}

function isDirectImageUrl(url: string | null) {
  if (!url) return false;
  try {
    const u = new URL(url);
    const ext = u.pathname.split('.').pop()?.toLowerCase() ?? '';
    if (['jpg','jpeg','png','webp','gif','avif','svg'].includes(ext)) return true;
    const h = u.hostname;
    return h.includes('unsplash.com') || h.includes('images.') || h.includes('cdn.')
      || h.includes('cloudinary') || h.includes('imagekit') || h.includes('imgix')
      || h.includes('picsum') || h.includes('placeholder') || h.includes('pexels')
      || h.includes('googleapis.com') || h.includes('googleusercontent');
  } catch { return false; }
}

export default async function StorefrontPage({ params }: PageProps) {
  const loja = await getLojaComProdutos(params.subdominio);
  if (!loja) notFound();

  const locale = getLocale();
  const moeda = loja.moeda ?? "EUR";
  const cor = loja.corPrimaria || "#153DFC";

  return (
    <>
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden py-20 px-4"
        style={{
          background: `linear-gradient(135deg, ${cor}18 0%, ${cor}08 50%, transparent 100%)`,
          borderBottom: `1px solid ${cor}20`,
        }}
      >
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, ${cor}, transparent 70%)` }} />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-8"
          style={{ background: `radial-gradient(circle, ${cor}, transparent 70%)` }} />

        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl font-black text-3xl text-white mb-5 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${cor}, ${cor}bb)` }}>
            {loja.nome.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">{loja.nome}</h1>
          <p className="mt-3 text-slate-500 text-lg">
            {loja.produtos.length} {loja.produtos.length !== 1
              ? t("store_products_label", locale)
              : t("store_product_label", locale)}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
            style={{ background: `${cor}15`, color: cor, border: `1px solid ${cor}30` }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: cor }} />
            {t("store_open_badge", locale)}
          </div>
        </div>
      </section>

      {/* ── Produtos ── */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        {loja.produtos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="text-6xl mb-6">🛍️</div>
            <h2 className="text-2xl font-bold text-slate-800">{t("store_coming_soon", locale)}</h2>
            <p className="mt-2 text-slate-400">{t("store_coming_soon_sub", locale)}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900">
                {t("store_all_products", locale)}
                <span className="ml-2 text-sm font-normal text-slate-400">({loja.produtos.length})</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {loja.produtos.map((produto) => {
                const hasImage = isDirectImageUrl(produto.imagemUrl);
                return (
                  <article key={produto.id}
                    className="group relative rounded-3xl overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)' }}>
                    {/* Área clicável — abre página de produto */}
                    <Link href={`/loja/${params.subdominio}/produto/${produto.id}`} className="block">
                      <div className="relative aspect-square overflow-hidden"
                        style={{ background: `linear-gradient(145deg, ${cor}10 0%, ${cor}05 100%)` }}>
                        {hasImage ? (
                          <Image
                            src={produto.imagemUrl!}
                            alt={produto.titulo}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg"
                              style={{ background: `linear-gradient(135deg, ${cor}, ${cor}88)` }}>
                              {produto.titulo.charAt(0).toUpperCase()}
                            </div>
                            <p className="text-xs text-slate-400 text-center line-clamp-2 leading-tight">{produto.titulo}</p>
                          </div>
                        )}

                        {produto.stock <= 0 && (
                          <span className="absolute top-2.5 left-2.5 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm uppercase tracking-wide">
                            {t("store_out_of_stock", locale)}
                          </span>
                        )}
                        {produto.stock > 0 && produto.stock <= 5 && (
                          <span className="absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide"
                            style={{ background: '#f97316' }}>
                            {t("store_last_units", locale)} {produto.stock}
                          </span>
                        )}

                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: `linear-gradient(to top, ${cor}20, transparent)` }} />
                      </div>

                      <div className="px-4 pt-4 pb-2">
                        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:underline underline-offset-2"
                          style={{ textDecorationColor: cor }}>
                          {produto.titulo}
                        </h3>
                        {produto.descricao && (
                          <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">{produto.descricao}</p>
                        )}
                        <p className="mt-3 text-xl font-black" style={{ color: cor }}>
                          {formatarPreco(Number(produto.preco), moeda)}
                        </p>
                      </div>
                    </Link>

                    {/* Botão carrinho fora do Link para não conflituar */}
                    <div className="px-4 pb-4">
                      <AddToCartButton
                        produto={{
                          id: produto.id,
                          titulo: produto.titulo,
                          preco: Number(produto.preco),
                          imagemUrl: produto.imagemUrl,
                          stock: produto.stock,
                          variantes: produto.variantes.map((v) => ({
                            id: v.id,
                            nomeOpcao: v.nomeOpcao,
                            precoExtra: Number(v.precoExtra),
                            stock: v.stock,
                          })),
                        }}
                        corPrimaria={cor}
                        locale={locale}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ── Trust badges ── */}
      <section className="border-y border-slate-100 py-10 px-4 mt-4"
        style={{ background: `linear-gradient(135deg, ${cor}06, ${cor}02)` }}>
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: "🚚", title: t("store_trust_1_title", locale), sub: t("store_trust_1_sub", locale) },
            { icon: "🔒", title: t("store_trust_2_title", locale), sub: t("store_trust_2_sub", locale) },
            { icon: "↩️", title: t("store_trust_3_title", locale), sub: t("store_trust_3_sub", locale) },
          ].map(item => (
            <div key={item.title} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: `${cor}15` }}>
                {item.icon}
              </div>
              <p className="font-semibold text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-400">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900">{t("store_reviews_title", locale)}</h2>
          <div className="flex items-center justify-center gap-1 mt-2">
            {Array.from({length:5}).map((_,i)=>(
              <span key={i} className="text-amber-400 text-xl">★</span>
            ))}
            <span className="ml-2 text-sm text-slate-500">{t("store_reviews_rating", locale)}</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { nome: "Maria S.", texto: t("store_reviews_sub", locale), nota: 5 },
            { nome: "João P.", texto: t("store_reviews_sub", locale), nota: 5 },
            { nome: "Ana M.", texto: t("store_reviews_sub", locale), nota: 4 },
          ].map((r, idx) => (
            <div key={idx}
              className="rounded-2xl border border-slate-100 bg-white p-5 hover:shadow-md transition-shadow"
              style={{ borderTop: `3px solid ${cor}` }}>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-base ${i < r.nota ? "text-amber-400" : "text-slate-200"}`}>★</span>
                ))}
              </div>
              <p className="text-sm text-slate-600 italic leading-relaxed">"{r.texto}"</p>
              <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-50">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: cor }}>
                  {r.nome.charAt(0)}
                </div>
                <p className="text-xs font-semibold text-slate-700">{r.nome}</p>
                <span className="ml-auto text-[10px] text-green-600 font-medium">{t("store_verified", locale)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
