"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { Tema } from "@/lib/temas";

interface Props {
  temas: Tema[];
  temaActivo: string;
  temPlano: boolean;
}

const NICHOS = ["todos", "geral", "moda", "moda-autor", "joalharia", "alta-joalharia", "mobiliario", "decoracao", "restaurante", "beleza", "cosmetica", "electronica", "servicos", "fitness"] as const;
const NICHO_LABEL: Record<string, string> = {
  todos: "Todos",
  geral: "Geral",
  moda: "Moda",
  "moda-autor": "Moda de Autor",
  joalharia: "Joalharia",
  "alta-joalharia": "Alta Joalharia",
  mobiliario: "Mobiliário",
  decoracao: "Decoração",
  restaurante: "Restaurante",
  beleza: "Beleza",
  cosmetica: "Cosmética",
  electronica: "Electrónica",
  servicos: "Serviços",
  fitness: "Fitness",
};

export function TemasClient({ temas, temaActivo, temPlano }: Props) {
  const [filtroNicho, setFiltroNicho] = useState("todos");
  const [preview, setPreview] = useState<Tema | null>(null);
  const [modoPreview, setModoPreview] = useState<"desktop" | "mobile">("desktop");
  const [aplicado, setAplicado] = useState(temaActivo);
  const [isPending, startTransition] = useTransition();
  const [aplicandoSlug, setAplicandoSlug] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const temasVisiveis = filtroNicho === "todos" ? temas : temas.filter(t => t.nicho === filtroNicho);
  const nichosComTemas = ["todos", ...Array.from(new Set(temas.map(t => t.nicho)))];

  async function aplicarTema(slug: string) {
    setErro(null);
    setAplicandoSlug(slug);
    startTransition(async () => {
      const res = await fetch("/api/loja/tema", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema: slug }),
      });
      const data = await res.json();
      if (res.ok) {
        setAplicado(slug);
        setPreview(null);
      } else {
        setErro(data.erro ?? "Erro ao aplicar tema");
      }
      setAplicandoSlug(null);
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Temas da Loja</h1>
          <p className="mt-1 text-sm text-gray-500">
            Escolhe o tema que melhor se adapta ao teu negócio. Podes mudar a qualquer momento.
          </p>
        </div>

        {erro && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {erro}
            {!temPlano && " — "}
            {!temPlano && (
              <a href="/dashboard/configuracoes/planos" className="underline font-medium">Ver planos Pro</a>
            )}
          </div>
        )}

        {/* Filtros de nicho */}
        <div className="flex gap-2 flex-wrap mb-8">
          {nichosComTemas.map(nicho => (
            <button
              key={nicho}
              onClick={() => setFiltroNicho(nicho)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                filtroNicho === nicho
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
              }`}
            >
              {NICHO_LABEL[nicho] ?? nicho}
            </button>
          ))}
        </div>

        {/* Grid de temas */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {temasVisiveis.map(tema => {
            const isActivo = aplicado === tema.slug;
            const isPro = tema.plano === "pro";
            const podeAplicar = !isPro || temPlano;

            return (
              <div
                key={tema.slug}
                className={`group relative bg-white rounded-2xl border-2 overflow-hidden transition-all duration-200 hover:shadow-lg ${
                  isActivo ? "border-gray-900 shadow-md" : "border-gray-100 hover:border-gray-300"
                }`}
              >
                {/* Preview image */}
                <div
                  className="relative aspect-[4/3] bg-gray-100 overflow-hidden cursor-pointer"
                  onClick={() => { setPreview(tema); setModoPreview("desktop"); }}
                >
                  <img
                    src={tema.previewDesktop}
                    alt={tema.nome}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Overlay hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold bg-black/50 rounded-full px-3 py-1.5">
                      Ver preview
                    </span>
                  </div>
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {isActivo && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold bg-gray-900 text-white">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        Activo
                      </span>
                    )}
                    {isPro && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold bg-amber-400 text-amber-900">
                        ✦ Pro
                      </span>
                    )}
                  </div>
                  {/* Cor do nicho */}
                  <div
                    className="absolute bottom-3 right-3 w-3 h-3 rounded-full ring-2 ring-white"
                    style={{ background: tema.cor }}
                  />
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{tema.nome}</h3>
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide ml-2 flex-shrink-0">
                      {tema.nichoLabel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">
                    {tema.descricao}
                  </p>

                  {/* Características */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {tema.caracteristicas.slice(0, 3).map(c => (
                      <span key={c} className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 rounded-md px-1.5 py-0.5">
                        {c}
                      </span>
                    ))}
                    {tema.caracteristicas.length > 3 && (
                      <span className="text-[10px] text-gray-400 px-1.5 py-0.5">
                        +{tema.caracteristicas.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Acções */}
                  <div className="flex gap-2">
                    {isActivo ? (
                      <span className="flex-1 text-center py-2 text-xs font-semibold text-gray-400 border border-gray-100 rounded-lg bg-gray-50">
                        Tema activo
                      </span>
                    ) : podeAplicar ? (
                      <button
                        onClick={() => aplicarTema(tema.slug)}
                        disabled={isPending && aplicandoSlug === tema.slug}
                        className="flex-1 py-2 text-xs font-semibold text-white bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isPending && aplicandoSlug === tema.slug ? "A aplicar…" : "Aplicar tema"}
                      </button>
                    ) : (
                      <a
                        href="/dashboard/configuracoes/planos"
                        className="flex-1 text-center py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
                      >
                        Upgrade para Pro
                      </a>
                    )}
                    <button
                      onClick={() => { setPreview(tema); setModoPreview("desktop"); }}
                      className="px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 hover:border-gray-400 rounded-lg transition-colors"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {temasVisiveis.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Nenhum tema disponível para este nicho.</p>
            <p className="text-xs mt-1">Novos temas são adicionados regularmente.</p>
          </div>
        )}
      </div>

      {/* ── Modal de preview ── */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: preview.cor }} />
                <div>
                  <h2 className="font-bold text-gray-900">{preview.nome}</h2>
                  <p className="text-xs text-gray-400">{preview.nichoLabel}</p>
                </div>
                {preview.plano === "pro" && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700">✦ Pro</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* Toggle desktop/mobile */}
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setModoPreview("desktop")}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${modoPreview === "desktop" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m8 21 4-4 4 4"/><path d="M8 17h8"/></svg>
                  </button>
                  <button
                    onClick={() => setModoPreview("mobile")}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${modoPreview === "mobile" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
                  </button>
                </div>
                <button onClick={() => setPreview(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            {/* Preview image */}
            <div className="bg-gray-100 flex items-center justify-center p-6 overflow-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
              {modoPreview === "desktop" ? (
                <div className="w-full max-w-2xl">
                  {/* Browser chrome */}
                  <div className="rounded-t-lg bg-gray-200 px-4 py-2 flex items-center gap-2">
                    <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-400"/><div className="w-2.5 h-2.5 rounded-full bg-yellow-400"/><div className="w-2.5 h-2.5 rounded-full bg-green-400"/></div>
                    <div className="flex-1 bg-white rounded-md text-[10px] text-gray-400 text-center px-2 py-0.5 mx-2">loja.linkcommerce.cc</div>
                  </div>
                  <img src={preview.previewDesktop} alt={preview.nome} className="w-full rounded-b-lg shadow-lg object-cover" />
                </div>
              ) : (
                <div className="w-[200px]">
                  {/* Phone chrome */}
                  <div className="rounded-t-2xl bg-gray-800 px-4 py-2 flex justify-center">
                    <div className="w-16 h-1.5 bg-gray-600 rounded-full"/>
                  </div>
                  <img src={preview.previewMobile} alt={preview.nome} className="w-full object-cover" />
                  <div className="rounded-b-2xl bg-gray-800 px-4 py-3 flex justify-center">
                    <div className="w-10 h-1 bg-gray-600 rounded-full"/>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {preview.caracteristicas.map(c => (
                  <span key={c} className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1">
                    {c}
                  </span>
                ))}
              </div>
              {aplicado === preview.slug ? (
                <span className="ml-4 flex-shrink-0 px-5 py-2 text-sm font-medium text-gray-400 border border-gray-100 rounded-lg bg-gray-50">
                  Tema activo
                </span>
              ) : (!temPlano && preview.plano === "pro") ? (
                <a href="/dashboard/configuracoes/planos"
                  className="ml-4 flex-shrink-0 px-5 py-2 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
                  Upgrade para Pro
                </a>
              ) : (
                <button
                  onClick={() => aplicarTema(preview.slug)}
                  disabled={isPending && aplicandoSlug === preview.slug}
                  className="ml-4 flex-shrink-0 px-5 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPending && aplicandoSlug === preview.slug ? "A aplicar…" : "Aplicar este tema"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
