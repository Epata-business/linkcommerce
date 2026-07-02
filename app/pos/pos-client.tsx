"use client";

import { useEffect, useState } from "react";
import { usePosStore } from "@/store/pos-store";
import { Button } from "@/components/ui/button";
import { formatarPreco } from "@/lib/moeda";

interface ProdutoPos {
  id: string;
  titulo: string;
  preco: number;
  stock: number;
  imagemUrl: string | null;
}

const LOJA_ID = process.env.NEXT_PUBLIC_DEMO_LOJA_ID ?? "";

export function PosClient({ moeda }: { moeda: string }) {
  const [produtos, setProdutos] = useState<ProdutoPos[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [online, setOnline] = useState(true);

  const { itens, adicionar, removerItem, limpar, total, finalizarVenda, pendentes, atualizarContadorPendentes, sincronizarPendentes } =
    usePosStore();

  useEffect(() => {
    fetch("/api/produtos")
      .then((r) => r.json())
      .then((data) => setProdutos(data.produtos ?? []))
      .catch(() => {});
    atualizarContadorPendentes();
  }, [atualizarContadorPendentes]);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => { setOnline(true); sincronizarPendentes(); };
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [sincronizarPendentes]);

  const produtosFiltrados = produtos.filter((p) =>
    p.titulo.toLowerCase().includes(pesquisa.toLowerCase())
  );

  async function handleFinalizarVenda() {
    await finalizarVenda(LOJA_ID);
    alert("Venda registada" + (online ? " e sincronizada." : " — será sincronizada quando a ligação voltar."));
  }

  return (
    <div className="flex h-screen flex-col">
      <div className={`flex items-center justify-between px-4 py-2 text-sm text-white ${online ? "bg-emerald-600" : "bg-amber-600"}`}>
        <span>{online ? "● Ligado" : "● Modo offline — as vendas serão guardadas localmente"}</span>
        {pendentes > 0 && <span className="font-medium">{pendentes} venda(s) por sincronizar</span>}
      </div>

      <div className="grid flex-1 grid-cols-3 overflow-hidden">
        {/* Produtos */}
        <div className="col-span-2 flex flex-col overflow-hidden border-r p-4">
          <input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar produto..."
            className="mb-4 rounded-lg border px-4 py-3 text-lg"
          />
          <div className="grid flex-1 grid-cols-3 gap-3 overflow-y-auto pb-4 sm:grid-cols-4">
            {produtosFiltrados.map((produto) => (
              <button
                key={produto.id}
                disabled={produto.stock <= 0}
                onClick={() => adicionar({ produtoId: produto.id, titulo: produto.titulo, quantidade: 1, precoUnitario: produto.preco })}
                className="flex flex-col items-center justify-center rounded-lg border p-3 text-center active:scale-95 disabled:opacity-40"
              >
                <span className="text-sm font-medium line-clamp-2">{produto.titulo}</span>
                <span className="mt-1 text-sm text-muted-foreground">{formatarPreco(produto.preco, moeda)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Carrinho */}
        <div className="flex flex-col p-4">
          <h2 className="text-lg font-semibold">Carrinho</h2>
          <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
            {itens.length === 0 && <p className="text-sm text-muted-foreground">Toque num produto para adicionar.</p>}
            {itens.map((item) => (
              <div key={`${item.produtoId}-${item.varianteId ?? ""}`} className="flex items-center justify-between rounded border p-2 text-sm">
                <div>
                  <p className="font-medium">{item.titulo}</p>
                  <p className="text-muted-foreground">
                    {item.quantidade} × {formatarPreco(item.precoUnitario, moeda)}
                  </p>
                </div>
                <button onClick={() => removerItem(item.produtoId, item.varianteId)} className="text-red-600">✕</button>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t pt-3">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatarPreco(total(), moeda)}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={limpar} disabled={itens.length === 0}>Limpar</Button>
              <Button className="flex-1" onClick={handleFinalizarVenda} disabled={itens.length === 0}>Finalizar venda</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
