"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import type { Locale } from "@/lib/i18n";

const labels: Record<Locale, { add: string; added: string; out: string }> = {
  pt: { add: "Adicionar ao carrinho", added: "Adicionado ✓", out: "Esgotado" },
  en: { add: "Add to cart", added: "Added ✓", out: "Out of stock" },
  fr: { add: "Ajouter au panier", added: "Ajouté ✓", out: "Épuisé" },
  es: { add: "Añadir al carrito", added: "Añadido ✓", out: "Agotado" },
};

interface VarianteUI {
  id: string;
  nomeOpcao: string;
  precoExtra: number;
  stock: number;
}

interface ProdutoUI {
  id: string;
  titulo: string;
  preco: number;
  imagemUrl: string | null;
  stock: number;
  variantes: VarianteUI[];
}

export function AddToCartButton({
  produto,
  corPrimaria,
  locale = "pt",
}: {
  produto: ProdutoUI;
  corPrimaria: string;
  locale?: Locale;
}) {
  const adicionar = useCartStore((s) => s.adicionar);
  const [varianteId, setVarianteId] = useState(produto.variantes[0]?.id);
  const [adicionado, setAdicionado] = useState(false);

  const variante = produto.variantes.find((v) => v.id === varianteId);
  const semStock = variante ? variante.stock <= 0 : produto.stock <= 0;
  const L = labels[locale] ?? labels.pt;

  function handleAdicionar() {
    adicionar({
      produtoId: produto.id,
      varianteId: variante?.id,
      titulo: variante ? `${produto.titulo} (${variante.nomeOpcao})` : produto.titulo,
      imagemUrl: produto.imagemUrl,
      precoUnitario: produto.preco + (variante?.precoExtra ?? 0),
      quantidade: 1,
    });
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 1200);
  }

  return (
    <div className="mt-2 space-y-2">
      {produto.variantes.length > 0 && (
        <select
          className="w-full rounded border px-2 py-1 text-sm"
          value={varianteId}
          onChange={(e) => setVarianteId(e.target.value)}
        >
          {produto.variantes.map((v) => (
            <option key={v.id} value={v.id} disabled={v.stock <= 0}>
              {v.nomeOpcao} {v.stock <= 0 ? `(${L.out.toLowerCase()})` : ""}
            </option>
          ))}
        </select>
      )}
      <Button
        size="sm"
        className="w-full"
        style={{ backgroundColor: corPrimaria }}
        disabled={semStock}
        onClick={handleAdicionar}
      >
        {semStock ? L.out : adicionado ? L.added : L.add}
      </Button>
    </div>
  );
}
