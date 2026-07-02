"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { formatarPreco } from "@/lib/moeda";
import type { Locale } from "@/lib/i18n";

const labels: Record<Locale, {
  cart: string; empty_title: string; empty_sub: string;
  checkout: string; secure: string; qty: string;
}> = {
  pt: { cart: "Carrinho", empty_title: "O seu carrinho está vazio", empty_sub: "Adicione produtos para continuar", checkout: "Finalizar compra →", secure: "Pagamento seguro com SSL", qty: "un." },
  en: { cart: "Cart", empty_title: "Your cart is empty", empty_sub: "Add products to continue", checkout: "Checkout →", secure: "Secure payment with SSL", qty: "pcs" },
  fr: { cart: "Panier", empty_title: "Votre panier est vide", empty_sub: "Ajoutez des produits pour continuer", checkout: "Finaliser →", secure: "Paiement sécurisé SSL", qty: "pcs" },
  es: { cart: "Carrito", empty_title: "Tu carrito está vacío", empty_sub: "Añade productos para continuar", checkout: "Finalizar compra →", secure: "Pago seguro con SSL", qty: "uds." },
};

export function CartDrawer({ corPrimaria, locale = "pt", subdominio }: { corPrimaria: string; locale?: Locale; subdominio?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => { useCartStore.persist.rehydrate(); }, []);
  const items = useCartStore((s) => s.itens);
  const remover = useCartStore((s) => s.remover);
  const total = items.reduce((sum, i) => sum + i.precoUnitario * i.quantidade, 0);
  const count = items.reduce((sum, i) => sum + i.quantidade, 0);
  const L = labels[locale] ?? labels.pt;

  // extrair subdominio do pathname se não for passado como prop
  const sub = subdominio ?? pathname.split("/")[2] ?? "";

  function irParaCheckout() {
    setOpen(false);
    router.push(`/loja/${sub}/checkout`);
  }

  return (
    <>
      {/* Cart button */}
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corPrimaria}bb)` }}
      >
        {/* Ícone saco de compras */}
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <span className="hidden sm:inline">{L.cart}</span>
        {count > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black shadow-sm ring-2"
            style={{ color: corPrimaria }}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white flex flex-col shadow-2xl transition-transform duration-300"
        style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-bold text-slate-900">
            {L.cart} {count > 0 && `(${count})`}
          </h2>
          <button onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
              <div className="text-5xl">🛍️</div>
              <p className="font-semibold text-slate-700">{L.empty_title}</p>
              <p className="text-sm text-slate-400">{L.empty_sub}</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.produtoId}-${item.varianteId}`}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{ background: `${corPrimaria}15` }}>
                  {item.imagemUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imagemUrl} alt={item.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black" style={{ color: corPrimaria }}>
                      {item.titulo.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.titulo}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.quantidade}× {formatarPreco(item.precoUnitario, "EUR")}
                  </p>
                  <p className="text-sm font-bold mt-1" style={{ color: corPrimaria }}>
                    {formatarPreco(item.precoUnitario * item.quantidade, "EUR")}
                  </p>
                </div>
                <button
                  onClick={() => remover(item.produtoId, item.varianteId)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t px-5 py-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Total</span>
              <span className="text-2xl font-black" style={{ color: corPrimaria }}>
                {formatarPreco(total, "EUR")}
              </span>
            </div>
            <button
              onClick={irParaCheckout}
              className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corPrimaria}bb)` }}
            >
              {L.checkout}
            </button>
            <p className="text-center text-xs text-slate-400">{L.secure}</p>
          </div>
        )}
      </div>
    </>
  );
}
