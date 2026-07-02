import { create } from "zustand";
import { persist } from "zustand/middleware";

// -----------------------------------------------------------------------------
// store/cart-store.ts
// Carrinho do cliente final (storefront). Persistente em localStorage,
// conforme pedido: "Carrinho de compras persistente (localStorage/sessão)".
// Distinto do store do POS (store/pos-store.ts), que usa IndexedDB.
// -----------------------------------------------------------------------------

export interface ItemCarrinho {
  produtoId: string;
  varianteId?: string;
  titulo: string;
  imagemUrl?: string | null;
  precoUnitario: number;
  quantidade: number;
}

interface CartState {
  itens: ItemCarrinho[];
  adicionar: (item: ItemCarrinho) => void;
  remover: (produtoId: string, varianteId?: string) => void;
  atualizarQuantidade: (produtoId: string, quantidade: number, varianteId?: string) => void;
  limpar: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      itens: [],

      adicionar: (item) =>
        set((state) => {
          const existente = state.itens.find(
            (i) => i.produtoId === item.produtoId && i.varianteId === item.varianteId
          );
          if (existente) {
            return {
              itens: state.itens.map((i) =>
                i === existente ? { ...i, quantidade: i.quantidade + item.quantidade } : i
              ),
            };
          }
          return { itens: [...state.itens, item] };
        }),

      remover: (produtoId, varianteId) =>
        set((state) => ({
          itens: state.itens.filter(
            (i) => !(i.produtoId === produtoId && i.varianteId === varianteId)
          ),
        })),

      atualizarQuantidade: (produtoId, quantidade, varianteId) =>
        set((state) => ({
          itens: state.itens.map((i) =>
            i.produtoId === produtoId && i.varianteId === varianteId ? { ...i, quantidade } : i
          ),
        })),

      limpar: () => set({ itens: [] }),

      total: () => get().itens.reduce((acc, i) => acc + i.precoUnitario * i.quantidade, 0),
    }),
    { name: "linkcommerce-cart", skipHydration: true } // chave no localStorage
  )
);
