"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  criarProduto, gerarDescricaoComIA, gerarTituloComIA, sugerirPrecoComIA,
  criarVariante, removerVariante,
} from "@/app/(dashboard)/dashboard/produtos/actions";

interface VarianteExistente {
  id: string;
  nomeOpcao: string;
  precoExtra: number;
  stock: number;
  sku?: string | null;
}

interface ProdutoFormDialogProps {
  trigger: React.ReactNode;
  produtoExistente?: {
    id: string;
    titulo: string;
    descricao: string;
    preco: number;
    sku: string;
    stock: number;
    imagemUrl: string;
    variantes?: VarianteExistente[];
  };
  onSubmitAction?: (formData: FormData) => Promise<void>;
}

export function ProdutoFormDialog({ trigger, produtoExistente, onSubmitAction }: ProdutoFormDialogProps) {
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState(produtoExistente?.titulo ?? "");
  const [descricao, setDescricao] = useState(produtoExistente?.descricao ?? "");
  const [imagemUrl, setImagemUrl] = useState(produtoExistente?.imagemUrl ?? "");
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [aGerarIA, setAGerarIA] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [tabAtiva, setTabAtiva] = useState<"info" | "variantes">("info");
  const [novaVariante, setNovaVariante] = useState({ nomeOpcao: "", precoExtra: "0", stock: "0", sku: "" });
  const [aAdicionarVariante, setAAdicionarVariante] = useState(false);
  const [variantesLocais, setVariantesLocais] = useState<VarianteExistente[]>(produtoExistente?.variantes ?? []);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Upload de imagem ──
  async function handleFicheiro(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState("uploading");
    const fd = new FormData();
    fd.append("ficheiro", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setImagemUrl(url);
      setUploadState("done");
    } catch {
      setUploadState("error");
    }
  }

  // ── IA ──
  async function handleDescricao() {
    if (!titulo) return;
    setAGerarIA("descricao");
    try { const texto = await gerarDescricaoComIA(titulo); setDescricao(texto); } catch {}
    setAGerarIA(null);
  }
  async function handleTitulo() {
    if (!titulo) return;
    setAGerarIA("titulo");
    try { const novo = await gerarTituloComIA(titulo); setTitulo(novo); } catch {}
    setAGerarIA(null);
  }
  async function handlePreco() {
    if (!titulo) return;
    setAGerarIA("preco");
    try {
      const sugestao = await sugerirPrecoComIA(titulo, descricao);
      const input = document.querySelector<HTMLInputElement>('[name="preco"]');
      if (input) { input.value = sugestao; input.dispatchEvent(new Event("input", { bubbles: true })); }
    } catch {}
    setAGerarIA(null);
  }

  // ── Adicionar variante ──
  async function handleAdicionarVariante() {
    if (!produtoExistente?.id || !novaVariante.nomeOpcao) return;
    setAAdicionarVariante(true);
    const fd = new FormData();
    fd.set("nomeOpcao", novaVariante.nomeOpcao);
    fd.set("precoExtra", novaVariante.precoExtra);
    fd.set("stock", novaVariante.stock);
    fd.set("sku", novaVariante.sku);
    try {
      await criarVariante(produtoExistente.id, fd);
      setVariantesLocais(prev => [...prev, { id: Date.now().toString(), ...novaVariante, precoExtra: parseFloat(novaVariante.precoExtra), stock: parseInt(novaVariante.stock) }]);
      setNovaVariante({ nomeOpcao: "", precoExtra: "0", stock: "0", sku: "" });
    } catch {}
    setAAdicionarVariante(false);
  }

  // ── Remover variante ──
  async function handleRemoverVariante(varianteId: string) {
    await removerVariante(varianteId);
    setVariantesLocais(prev => prev.filter(v => v.id !== varianteId));
  }

  function handleSubmit(formData: FormData) {
    formData.set("imagemUrl", imagemUrl);
    startTransition(async () => {
      await (onSubmitAction ?? criarProduto)(formData);
      setAberto(false);
    });
  }

  return (
    <>
      <span onClick={() => setAberto(true)}>{trigger}</span>
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="px-6 pt-6 pb-0 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">
                  {produtoExistente ? "Editar produto" : "Novo produto"}
                </h2>
                <button onClick={() => setAberto(false)} className="text-slate-400 hover:text-slate-700 text-xl">×</button>
              </div>

              {/* Tabs (só no modo edição) */}
              {produtoExistente && (
                <div className="flex border-b border-slate-100 mb-0">
                  {[
                    { key: "info", label: "Informações" },
                    { key: "variantes", label: `Variantes ${variantesLocais.length > 0 ? `(${variantesLocais.length})` : ""}` },
                  ].map((tab) => (
                    <button key={tab.key} onClick={() => setTabAtiva(tab.key as "info" | "variantes")}
                      className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px
                        ${tabAtiva === tab.key ? "border-blue-500 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-700"}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Body scrollável */}
            <div className="flex-1 overflow-y-auto px-6 py-5">

              {/* ── TAB INFO ── */}
              {tabAtiva === "info" && (
                <form id="form-produto" action={handleSubmit} className="space-y-4">
                  {/* Título */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-slate-700">Título</label>
                      <button type="button" onClick={handleTitulo} disabled={!titulo || aGerarIA !== null}
                        className="text-xs text-purple-600 font-medium disabled:opacity-40">
                        {aGerarIA === "titulo" ? "✨ A melhorar…" : "✨ Melhorar título"}
                      </button>
                    </div>
                    <input name="titulo" required value={titulo} onChange={(e) => setTitulo(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                  </div>

                  {/* Descrição */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-slate-700">Descrição</label>
                      <button type="button" onClick={handleDescricao} disabled={!titulo || aGerarIA !== null}
                        className="text-xs text-blue-600 font-medium disabled:opacity-40">
                        {aGerarIA === "descricao" ? "✨ A gerar…" : "✨ Gerar com IA"}
                      </button>
                    </div>
                    <textarea name="descricao" rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
                  </div>

                  {/* Imagem */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Imagem do produto</label>
                    <div className="relative rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors cursor-pointer"
                      onClick={() => fileRef.current?.click()}>
                      {imagemUrl ? (
                        <div className="flex items-center gap-3 p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imagemUrl} alt="" className="w-16 h-16 object-cover rounded-lg" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-600">✓ Imagem carregada</p>
                            <p className="text-xs text-slate-400 truncate">{imagemUrl}</p>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setImagemUrl(""); setUploadState("idle"); }}
                            className="text-slate-400 hover:text-red-500 text-lg flex-shrink-0">×</button>
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          {uploadState === "uploading"
                            ? <p className="text-sm text-blue-600 font-medium">A carregar…</p>
                            : <>
                              <div className="text-3xl mb-2">📷</div>
                              <p className="text-sm font-medium text-slate-700">Clique para adicionar imagem</p>
                              <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP · Máx. 5 MB</p>
                              {uploadState === "error" && <p className="text-xs text-red-500 mt-1">Erro no upload. Tente novamente.</p>}
                            </>}
                        </div>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFicheiro} />
                    {!imagemUrl && (
                      <input value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500 focus:outline-none"
                        placeholder="Ou cole uma URL de imagem directamente" />
                    )}
                  </div>

                  {/* Preço + Stock + SKU */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-slate-700">Preço (€)</label>
                        <button type="button" onClick={handlePreco} disabled={!titulo || aGerarIA !== null}
                          className="text-[10px] text-green-600 font-medium disabled:opacity-40">✨ IA</button>
                      </div>
                      <input name="preco" type="number" step="0.01" required defaultValue={produtoExistente?.preco}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Stock</label>
                      <input name="stock" type="number" required defaultValue={produtoExistente?.stock ?? 0}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">SKU</label>
                      <input name="sku" defaultValue={produtoExistente?.sku}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                    </div>
                  </div>

                  {aGerarIA && (
                    <div className="rounded-xl bg-purple-50 border border-purple-100 px-4 py-3 flex items-center gap-2">
                      <span className="animate-spin text-purple-500">✦</span>
                      <p className="text-sm text-purple-700 font-medium">IA a trabalhar…</p>
                    </div>
                  )}
                </form>
              )}

              {/* ── TAB VARIANTES ── */}
              {tabAtiva === "variantes" && produtoExistente && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">
                    Variantes permitem ao cliente escolher tamanho, cor, etc. O preço extra soma-se ao preço base do produto.
                  </p>

                  {/* Lista de variantes existentes */}
                  {variantesLocais.length > 0 ? (
                    <div className="space-y-2">
                      {variantesLocais.map((v) => (
                        <div key={v.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{v.nomeOpcao}</p>
                            <p className="text-xs text-slate-400">
                              {v.precoExtra > 0 ? `+${v.precoExtra}€` : "sem extra"} · stock: {v.stock}
                              {v.sku ? ` · SKU: ${v.sku}` : ""}
                            </p>
                          </div>
                          <button onClick={() => handleRemoverVariante(v.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors text-lg flex-shrink-0">×</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                      <p className="text-sm text-slate-400">Sem variantes ainda</p>
                      <p className="text-xs text-slate-300 mt-1">ex: Tamanho S, Tamanho M, Cor Azul…</p>
                    </div>
                  )}

                  {/* Adicionar nova variante */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nova variante</p>
                    <input placeholder="Nome da opção (ex: Tamanho L, Cor Azul)"
                      value={novaVariante.nomeOpcao}
                      onChange={(e) => setNovaVariante(v => ({ ...v, nomeOpcao: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Preço extra (€)</label>
                        <input type="number" step="0.01" placeholder="0"
                          value={novaVariante.precoExtra}
                          onChange={(e) => setNovaVariante(v => ({ ...v, precoExtra: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Stock</label>
                        <input type="number" placeholder="0"
                          value={novaVariante.stock}
                          onChange={(e) => setNovaVariante(v => ({ ...v, stock: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">SKU</label>
                        <input placeholder="opcional"
                          value={novaVariante.sku}
                          onChange={(e) => setNovaVariante(v => ({ ...v, sku: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none" />
                      </div>
                    </div>
                    <button onClick={handleAdicionarVariante}
                      disabled={!novaVariante.nomeOpcao || aAdicionarVariante}
                      className="w-full rounded-xl py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-40 transition-colors">
                      {aAdicionarVariante ? "A adicionar…" : "+ Adicionar variante"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 flex-shrink-0">
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
              {tabAtiva === "info" && (
                <Button type="submit" form="form-produto" disabled={isPending}>
                  {isPending ? "A guardar…" : "Guardar produto"}
                </Button>
              )}
              {tabAtiva === "variantes" && (
                <Button type="button" onClick={() => setAberto(false)}>Fechar</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
