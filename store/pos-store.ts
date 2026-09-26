import { create } from "zustand";
import { guardarVendaOffline, listarVendasPendentes, marcarComoSincronizada } from "@/lib/pos-db";

export interface ItemPosCarrinho {
  produtoId: string;
  varianteId?: string;
  titulo: string;
  quantidade: number;
  precoUnitario: number;
}

interface PosState {
  itens: ItemPosCarrinho[];
  aSincronizar: boolean;
  pendentes: number;
  adicionar: (item: ItemPosCarrinho) => void;
  removerItem: (produtoId: string, varianteId?: string) => void;
  ajustarQuantidade: (produtoId: string, varianteId: string | undefined, quantidade: number) => void;
  limpar: () => void;
  total: () => number;
  finalizarVenda: (lojaId: string, clienteEmail?: string, clienteNome?: string, metodoPagamento?: string) => Promise<void>;
  sincronizarPendentes: () => Promise<void>;
  atualizarContadorPendentes: () => Promise<void>;
}

export const usePosStore = create<PosState>((set, get) => ({
  itens: [],
  aSincronizar: false,
  pendentes: 0,

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

  removerItem: (produtoId, varianteId) =>
    set((state) => ({
      itens: state.itens.filter((i) => !(i.produtoId === produtoId && i.varianteId === varianteId)),
    })),

  ajustarQuantidade: (produtoId, varianteId, quantidade) =>
    set((state) => {
      if (quantidade <= 0) {
        return { itens: state.itens.filter(i => !(i.produtoId === produtoId && i.varianteId === varianteId)) };
      }
      return {
        itens: state.itens.map(i =>
          i.produtoId === produtoId && i.varianteId === varianteId
            ? { ...i, quantidade }
            : i
        ),
      };
    }),

  limpar: () => set({ itens: [] }),

  total: () => get().itens.reduce((acc, i) => acc + i.precoUnitario * i.quantidade, 0),

  // Grava SEMPRE localmente primeiro — zero perda de venda offline.
  finalizarVenda: async (lojaId, clienteEmail, clienteNome, metodoPagamento) => {
    const { itens, total } = get();
    if (itens.length === 0) return;

    const venda = {
      clientUuid: crypto.randomUUID(),
      lojaId,
      itens,
      total: total(),
      clienteEmail,
      clienteNome,
      metodoPagamento,
      criadoEm: new Date().toISOString(),
      sincronizada: false,
    };

    await guardarVendaOffline(venda);
    set({ itens: [] });

    if (navigator.onLine) {
      await get().sincronizarPendentes();
    } else {
      await get().atualizarContadorPendentes();
    }
  },

  sincronizarPendentes: async () => {
    if (get().aSincronizar) return;
    set({ aSincronizar: true });

    try {
      const pendentes = await listarVendasPendentes();
      if (pendentes.length === 0) return;

      const resposta = await fetch("/api/pos/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendas: pendentes }),
      });

      if (resposta.ok) {
        const { sincronizadas } = await resposta.json();
        for (const clientUuid of sincronizadas as string[]) {
          await marcarComoSincronizada(clientUuid);
        }
      }
    } catch {
      // Sem rede — vendas ficam guardadas e são retentadas no próximo 'online'.
    } finally {
      set({ aSincronizar: false });
      await get().atualizarContadorPendentes();
    }
  },

  atualizarContadorPendentes: async () => {
    const pendentes = await listarVendasPendentes();
    set({ pendentes: pendentes.length });
  },
}));
