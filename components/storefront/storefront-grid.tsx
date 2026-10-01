"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { StorefrontSearch } from "./storefront-search";
import { AddToCartButton } from "./add-to-cart-button";
import { formatarPreco } from "@/lib/moeda";

interface Variante {
  id: string;
  nomeOpcao: string;
  precoExtra: number;
  stock: number;
}

interface Produto {
  id: string;
  titulo: string;
  descricao: string | null;
  preco: number;
  imagemUrl: string | null;
  stock: number;
  variantes: Variante[];
}

interface Props {
  produtos: Produto[];
  subdominio: string;
  moeda: string;
  corPrimaria: string;
  tema?: string;
  cardBg?: string;
  cardText?: string;
  initialQuery: string;
  locale: string;
  outOfStockLabel: string;
  lastUnitsLabel: string;
}

function isDirectImageUrl(url: string | null) {
  if (!url) return false;
  try {
    const u = new URL(url);
    const ext = u.pathname.split(".").pop()?.toLowerCase() ?? "";
    if (["jpg", "jpeg", "png", "webp", "gif", "avif", "svg"].includes(ext)) return true;
    const h = u.hostname;
    return (
      h.includes("unsplash.com") || h.includes("images.") || h.includes("cdn.") ||
      h.includes("cloudinary") || h.includes("imagekit") || h.includes("imgix") ||
      h.includes("picsum") || h.includes("placeholder") || h.includes("pexels") ||
      h.includes("googleapis.com") || h.includes("googleusercontent")
    );
  } catch { return false; }
}

export function StorefrontGrid({
  produtos, subdominio, moeda, corPrimaria, tema, cardBg, cardText, initialQuery, outOfStockLabel, lastUnitsLabel,
}: Props) {
  const [filtered, setFiltered] = useState<Produto[]>(() => {
    if (!initialQuery) return produtos;
    const lower = initialQuery.toLowerCase();
    return produtos.filter(
      (p) => p.titulo.toLowerCase().includes(lower) || (p.descricao?.toLowerCase().includes(lower) ?? false)
    );
  });

  return (
    <>
      <StorefrontSearch
        produtos={produtos}
        corPrimaria={corPrimaria}
        initialQuery={initialQuery}
        onFilter={(f) => setFiltered(f as Produto[])}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-semibold text-slate-700">Nenhum produto encontrado</p>
          <p className="text-slate-400 text-sm mt-1">Tenta outra pesquisa</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((produto) => {
            const hasImage = isDirectImageUrl(produto.imagemUrl);
            return (
              <article
                key={produto.id}
                className={`group relative rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${cardBg ?? "bg-white"} ${cardText ?? "text-slate-900"}`}
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}
              >
                <Link href={`/loja/${subdominio}/produto/${produto.id}`} className="block">
                  <div
                    className="relative aspect-square overflow-hidden"
                    style={{ background: `linear-gradient(145deg, ${corPrimaria}10 0%, ${corPrimaria}05 100%)` }}
                  >
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
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg"
                          style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corPrimaria}88)` }}
                        >
                          {produto.titulo.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xs text-slate-400 text-center line-clamp-2 leading-tight">{produto.titulo}</p>
                      </div>
                    )}

                    {produto.stock <= 0 && (
                      <span className="absolute top-2.5 left-2.5 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm uppercase tracking-wide">
                        {outOfStockLabel}
                      </span>
                    )}
                    {produto.stock > 0 && produto.stock <= 5 && (
                      <span
                        className="absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide"
                        style={{ background: "#f97316" }}
                      >
                        {lastUnitsLabel} {produto.stock}
                      </span>
                    )}

                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `linear-gradient(to top, ${corPrimaria}20, transparent)` }}
                    />
                  </div>

                  <div className="px-4 pt-4 pb-2">
                    <h3
                      className={`font-semibold text-sm leading-snug line-clamp-2 group-hover:underline underline-offset-2 ${cardText ?? "text-slate-900"}`}
                      style={{ textDecorationColor: corPrimaria }}
                    >
                      {produto.titulo}
                    </h3>
                    {produto.descricao && (
                      <p className={`mt-1 text-xs line-clamp-2 leading-relaxed opacity-50 ${cardText ?? "text-slate-400"}`}>{produto.descricao}</p>
                    )}
                    <p className="mt-3 text-xl font-black" style={{ color: corPrimaria }}>
                      {formatarPreco(produto.preco, moeda)}
                    </p>
                  </div>
                </Link>

                <div className="px-4 pb-4">
                  <AddToCartButton
                    produto={{
                      id: produto.id,
                      titulo: produto.titulo,
                      preco: produto.preco,
                      imagemUrl: produto.imagemUrl,
                      stock: produto.stock,
                      variantes: produto.variantes,
                    }}
                    corPrimaria={corPrimaria}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
