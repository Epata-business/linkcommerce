import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarPreco } from "@/lib/moeda";
import { getLocale, t } from "@/lib/i18n";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { ProductGallery } from "@/components/storefront/product-gallery";

interface Props {
  params: { subdominio: string; id: string };
}

function isDirectImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /^https?:\/\//i.test(url);
}

export async function generateMetadata({ params }: Props) {
  const [produto, loja] = await Promise.all([
    prisma.produto.findFirst({
      where: { id: params.id, loja: { subdominio: params.subdominio }, ativo: true },
      select: { titulo: true, descricao: true, imagemUrl: true, preco: true },
    }),
    prisma.loja.findUnique({ where: { subdominio: params.subdominio }, select: { nome: true } }),
  ]);
  if (!produto) return {};
  const desc = produto.descricao ?? `Compre ${produto.titulo} na loja ${loja?.nome ?? ""}.`;
  const url = `https://${params.subdominio}.linkcommerce.app/produto/${params.id}`;
  return {
    title: `${produto.titulo} — ${loja?.nome ?? ""}`,
    description: desc,
    openGraph: {
      title: produto.titulo,
      description: desc,
      url,
      type: "website",
      images: produto.imagemUrl ? [{ url: produto.imagemUrl, width: 800, height: 800, alt: produto.titulo }] : [],
    },
    twitter: { card: "summary_large_image", title: produto.titulo, description: desc },
    metadataBase: new URL(`https://${params.subdominio}.linkcommerce.app`),
  };
}

export default async function ProdutoPage({ params }: Props) {
  const locale = getLocale();

  const [loja, produto] = await Promise.all([
    prisma.loja.findUnique({
      where: { subdominio: params.subdominio },
      select: { nome: true, corPrimaria: true, moeda: true, telefoneWA: true },
    }),
    prisma.produto.findFirst({
      where: { id: params.id, loja: { subdominio: params.subdominio }, ativo: true },
      include: {
        variantes: { orderBy: { nomeOpcao: "asc" } },
        loja: { select: { nome: true, corPrimaria: true, moeda: true } },
      },
    }),
  ]);

  if (!loja || !produto) notFound();

  const cor = loja.corPrimaria || "#153DFC";
  const moeda = loja.moeda ?? "EUR";
  const preco = Number(produto.preco);
  const telefoneWA = loja.telefoneWA?.replace(/\D/g, "") ?? null;
  const hasImage = isDirectImageUrl(produto.imagemUrl);

  // Produtos relacionados (mesma loja, excluindo este)
  const relacionados = await prisma.produto.findMany({
    where: { lojaId: produto.lojaId, ativo: true, id: { not: produto.id } },
    take: 4,
    orderBy: { createdAt: "desc" },
    select: { id: true, titulo: true, preco: true, imagemUrl: true, stock: true },
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <nav className="flex items-center gap-2 text-xs text-slate-400">
          <Link href={`/loja/${params.subdominio}`} className="hover:text-slate-700 transition-colors">
            {loja.nome}
          </Link>
          <span>›</span>
          <span className="text-slate-600 font-medium truncate max-w-[200px]">{produto.titulo}</span>
        </nav>
      </div>

      {/* ── Produto principal ── */}
      <section className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-2 gap-10 lg:gap-16 items-start">

        {/* Galeria / Imagem */}
        <div className="sticky top-24">
          {hasImage ? (
            <ProductGallery imagemUrl={produto.imagemUrl!} titulo={produto.titulo} cor={cor} />
          ) : (
            <div className="aspect-square rounded-3xl flex items-center justify-center text-7xl font-black text-white shadow-inner"
              style={{ background: `linear-gradient(145deg, ${cor}, ${cor}88)` }}>
              {produto.titulo.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          {/* Badges de stock */}
          <div className="flex items-center gap-2 flex-wrap">
            {produto.stock <= 0 ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wide">
                {t("product_out_of_stock", locale)}
              </span>
            ) : produto.stock <= 5 ? (
              <span className="rounded-full px-3 py-1 text-xs font-bold text-white uppercase tracking-wide"
                style={{ background: "#f97316" }}>
                {t("product_last_units", locale).replace("{n}", String(produto.stock))}
              </span>
            ) : (
              <span className="rounded-full px-3 py-1 text-xs font-bold text-white uppercase tracking-wide"
                style={{ background: cor }}>
                {t("product_in_stock", locale)}
              </span>
            )}
            {produto.sku && (
              <span className="text-xs text-slate-400">SKU: {produto.sku}</span>
            )}
          </div>

          {/* Título */}
          <h1 className="text-3xl font-black text-slate-900 leading-tight">{produto.titulo}</h1>

          {/* Preço */}
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black" style={{ color: cor }}>
              {formatarPreco(preco, moeda)}
            </span>
          </div>

          {/* Descrição */}
          {produto.descricao && (
            <div className="prose prose-sm text-slate-600 max-w-none leading-relaxed border-t border-slate-100 pt-5">
              {produto.descricao.split("\n").map((linha, i) => (
                <p key={i}>{linha}</p>
              ))}
            </div>
          )}

          {/* Variantes + botão adicionar ao carrinho */}
          <div className="border-t border-slate-100 pt-5">
            <AddToCartButtonGrande
              produto={{
                id: produto.id,
                titulo: produto.titulo,
                preco,
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

          {/* Comprar pelo WhatsApp */}
          {telefoneWA && produto.stock > 0 && (
            <a
              href={`https://wa.me/${telefoneWA}?text=${encodeURIComponent(`Olá! Tenho interesse em comprar: ${produto.titulo} — ${formatarPreco(preco, moeda)}\n${`https://${params.subdominio}.linkcommerce.app/produto/${params.id}`}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full rounded-2xl py-4 font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ background: "#25D366" }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Comprar pelo WhatsApp
            </a>
          )}

          {/* Garantias */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: "🔒", label: t("checkout_guarantee_payment", locale) },
              { icon: "↩️", label: t("checkout_guarantee_returns", locale) },
              { icon: "📦", label: t("checkout_guarantee_shipping", locale) },
            ].map((g) => (
              <div key={g.label} className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-100 p-3 text-center">
                <span className="text-xl">{g.icon}</span>
                <span className="text-[10px] font-semibold text-slate-500">{g.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Produtos relacionados ── */}
      {relacionados.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12 border-t border-slate-100 mt-4">
          <h2 className="text-xl font-bold text-slate-900 mb-6">{t("product_related", locale)}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relacionados.map((p) => {
              const img = isDirectImageUrl(p.imagemUrl);
              return (
                <Link key={p.id} href={`/loja/${params.subdominio}/produto/${p.id}`}
                  className="group rounded-2xl overflow-hidden bg-white border border-slate-100 hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className="aspect-square relative overflow-hidden"
                    style={{ background: `${cor}10` }}>
                    {img ? (
                      <Image src={p.imagemUrl!} alt={p.titulo} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="25vw" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-white"
                        style={{ background: `linear-gradient(135deg,${cor},${cor}88)` }}>
                        {p.titulo.charAt(0)}
                      </div>
                    )}
                    {p.stock <= 0 && (
                      <span className="absolute top-2 left-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-[9px] font-bold text-white uppercase">{t("product_out_of_stock", locale)}</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-2">{p.titulo}</p>
                    <p className="mt-1 text-sm font-black" style={{ color: cor }}>
                      {formatarPreco(Number(p.preco), moeda)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

// Versão grande do botão para a página de produto
function AddToCartButtonGrande(props: React.ComponentProps<typeof AddToCartButton>) {
  return (
    <div className="[&_button]:!py-4 [&_button]:!text-base [&_button]:!rounded-2xl [&_button]:!font-bold [&_select]:!py-3 [&_select]:!text-sm [&_select]:!rounded-xl">
      <AddToCartButton {...props} />
    </div>
  );
}
