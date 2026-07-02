import { create } from "zustand";
import { guardarVendaOffline, listarVendasPendentes, marcarComoSincronizada } from "@/lib/pos-db";

// -----------------------------------------------------------------------------
// store/pos-store.ts
// Estado global do POS (carrinho da venda actual + estado de sincronização).
// Modo offline crítico: toda venda finalizada é primeiro escrita no IndexedDB;
// só depois tentamos enviar para /api/pos/sync. Se falhar (sem rede), fica
// marcada como pendente e uma venda no listener 'online' tenta sincronizar
// tudo automaticamente.
// -----------------------------------------------------------------------------

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
  limpar: () => void;
  total: () => number;
  finalizarVenda: (lojaId: string, clienteEmail?: string) => Promise<void>;
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

  limpar: () => set({ itens: [] }),

  total: () => get().itens.reduce((acc, i) => acc + i.precoUnitario * i.quantidade, 0),

  // Passo crítico: grava SEMPRE localmente primeiro (garante zero perda de
  // venda mesmo que a chamada de rede a seguir falhe), só depois tenta
  // sincronizar imediatamente se houver ligação.
  finalizarVenda: async (lojaId, clienteEmail) => {
    const { itens, total } = get();
    if (itens.length === 0) return;

    const venda = {
      clientUuid: crypto.randomUUID(),
      lojaId,
      itens,
      total: total(),
      clienteEmail,
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

  // Envia todas as vendas ainda não sincronizadas para /api/pos/sync.
  // Idempotente: o servidor usa clientUuid como chave única (ver Pedido.clientUuid
  // no schema.prisma), por isso reenviar a mesma venda não duplica o pedido.
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
      // Sem rede ou servidor indisponível: as vendas continuam guardadas
      // localmente e serão retentadas no próximo evento 'online' ou no
      // próximo finalizarVenda().
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
