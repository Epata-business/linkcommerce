"use client";

import { useEffect, useState, useCallback } from "react";
import { usePosStore } from "@/store/pos-store";
import { formatarPreco } from "@/lib/moeda";

interface ProdutoPos {
  id: string;
  titulo: string;
  preco: number;
  stock: number;
  imagemUrl: string | null;
}

interface Props {
  lojaId: string;
  moeda: string;
  nomeLoja: string;
  cor: string;
}

const METODOS_PAGAMENTO = ["Numerário", "Transferência Bancária", "Cartão", "Outro"];

export function PosClient({ lojaId, moeda, nomeLoja, cor }: Props) {
  const [produtos, setProdutos] = useState<ProdutoPos[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [online, setOnline] = useState(true);
  const [clienteNome, setClienteNome] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState(METODOS_PAGAMENTO[0]);
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "erro"; msg: string } | null>(null);
  const [carregando, setCarregando] = useState(true);

  const {
    itens, adicionar, removerItem, ajustarQuantidade, limpar,
    total, finalizarVenda, pendentes,
    atualizarContadorPendentes, sincronizarPendentes,
  } = usePosStore();

  const carregarProdutos = useCallback(() => {
    setCarregando(true);
    fetch("/api/produtos")
      .then(r => r.json())
      .then(data => setProdutos(data.produtos ?? []))
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    carregarProdutos();
    atualizarContadorPendentes();
  }, [carregarProdutos, atualizarContadorPendentes]);

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

  const produtosFiltrados = produtos.filter(p =>
    p.titulo.toLowerCase().includes(pesquisa.toLowerCase())
  );

  async function handleFinalizarVenda() {
    if (itens.length === 0) return;
    try {
      await finalizarVenda(lojaId, clienteEmail || undefined, clienteNome || undefined, metodoPagamento);
      setFeedback({
        tipo: "ok",
        msg: online
          ? `Venda registada e sincronizada. ${clienteNome ? `Cliente: ${clienteNome}.` : ""}`
          : "Venda guardada localmente — será sincronizada quando a ligação voltar.",
      });
      setClienteNome("");
      setClienteEmail("");
      setMetodoPagamento(METODOS_PAGAMENTO[0]);
      // Recarregar stock
      carregarProdutos();
      setTimeout(() => setFeedback(null), 5000);
    } catch {
      setFeedback({ tipo: "erro", msg: "Erro ao registar venda. Tente novamente." });
    }
  }

  const totalCarrinho = total();

  return (
    <div className="flex h-screen flex-col bg-slate-100 select-none">
      {/* Barra de topo */}
      <div className="flex items-center justify-between px-4 py-2.5 text-white text-sm"
        style={{ background: cor }}>
        <div className="flex items-center gap-3">
          <span className="font-bold text-base">{nomeLoja}</span>
          <span className="text-xs opacity-75">POS</span>
        </div>
        <div className="flex items-center gap-3">
          {pendentes > 0 && (
            <span className="bg-amber-400 text-amber-900 text-xs font-bold rounded-full px-2 py-0.5">
              {pendentes} por sincronizar
            </span>
          )}
          <span className={`text-xs font-semibold ${online ? "text-green-300" : "text-amber-300"}`}>
            {online ? "● Online" : "● Offline"}
          </span>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`px-4 py-2.5 text-sm font-medium text-white ${feedback.tipo === "ok" ? "bg-green-600" : "bg-red-600"}`}>
          {feedback.msg}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Grelha de produtos */}
        <div className="flex flex-1 flex-col overflow-hidden p-3 gap-3">
          <input
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
            placeholder="Pesquisar produto…"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          {carregando ? (
            <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 overflow-y-auto content-start">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-white animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 overflow-y-auto pb-2 content-start">
              {produtosFiltrados.map(produto => {
                const semStock = produto.stock <= 0;
                const noCarrinho = itens.find(i => i.produtoId === produto.id);
                return (
                  <button
                    key={produto.id}
                    disabled={semStock}
                    onClick={() => adicionar({
                      produtoId: produto.id,
                      titulo: produto.titulo,
                      quantidade: 1,
                      precoUnitario: produto.preco,
                    })}
                    className={`relative flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all active:scale-95 ${
                      semStock
                        ? "bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed"
                        : noCarrinho
                        ? "bg-white border-2 shadow-md"
                        : "bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md"
                    }`}
                    style={noCarrinho ? { borderColor: cor } : {}}
                  >
                    {noCarrinho && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full text-[10px] font-black text-white flex items-center justify-center"
                        style={{ background: cor }}>
                        {noCarrinho.quantidade}
                      </span>
                    )}
                    {produto.imagemUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={produto.imagemUrl} alt={produto.titulo}
                        className="w-10 h-10 object-cover rounded-lg mb-2" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 mb-2 flex items-center justify-center text-xl">
                        📦
                      </div>
                    )}
                    <span className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight">
                      {produto.titulo}
                    </span>
                    <span className="mt-1.5 text-sm font-black tabular-nums" style={{ color: cor }}>
                      {formatarPreco(produto.preco, moeda)}
                    </span>
                    {produto.stock <= 5 && !semStock && (
                      <span className="mt-0.5 text-[9px] font-bold text-amber-500">
                        Stock: {produto.stock}
                      </span>
                    )}
                  </button>
                );
              })}
              {produtosFiltrados.length === 0 && !carregando && (
                <div className="col-span-full flex items-center justify-center py-16 text-slate-400 text-sm">
                  {pesquisa ? "Nenhum produto encontrado." : "Sem produtos activos."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Painel lateral — carrinho + checkout */}
        <div className="flex w-80 flex-col bg-white border-l border-slate-200 shadow-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Venda actual</h2>
            {itens.length > 0 && (
              <button onClick={limpar} className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors">
                Limpar
              </button>
            )}
          </div>

          {/* Itens */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {itens.length === 0 ? (
              <p className="text-center text-sm text-slate-300 pt-8">Toque num produto para adicionar.</p>
            ) : (
              itens.map(item => (
                <div key={`${item.produtoId}-${item.varianteId ?? ""}`}
                  className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.titulo}</p>
                    <p className="text-xs text-slate-400 tabular-nums">
                      {formatarPreco(item.precoUnitario, moeda)} × {item.quantidade}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => ajustarQuantidade(item.produtoId, item.varianteId, item.quantidade - 1)}
                      className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-sm font-bold flex items-center justify-center hover:bg-slate-300 transition-colors"
                    >−</button>
                    <span className="w-5 text-center text-xs font-bold text-slate-800">{item.quantidade}</span>
                    <button
                      onClick={() => ajustarQuantidade(item.produtoId, item.varianteId, item.quantidade + 1)}
                      className="w-6 h-6 rounded-full text-white text-sm font-bold flex items-center justify-center hover:opacity-80 transition-opacity"
                      style={{ background: cor }}
                    >+</button>
                  </div>
                  <button
                    onClick={() => removerItem(item.produtoId, item.varianteId)}
                    className="text-slate-300 hover:text-red-400 transition-colors ml-1 flex-shrink-0"
                  >✕</button>
                </div>
              ))
            )}
          </div>

          {/* Dados do cliente + checkout */}
          <div className="border-t border-slate-100 px-4 py-4 space-y-3">
            <input
              value={clienteNome}
              onChange={e => setClienteNome(e.target.value)}
              placeholder="Nome do cliente (opcional)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={metodoPagamento}
              onChange={e => setMetodoPagamento(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {METODOS_PAGAMENTO.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <div className="flex items-center justify-between py-2 border-t border-slate-100">
              <span className="text-sm font-bold text-slate-700">Total</span>
              <span className="text-xl font-black tabular-nums" style={{ color: cor }}>
                {formatarPreco(totalCarrinho, moeda)}
              </span>
            </div>

            <button
              onClick={handleFinalizarVenda}
              disabled={itens.length === 0}
              className="w-full rounded-xl py-3.5 text-base font-black text-white transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: cor }}
            >
              Finalizar venda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
