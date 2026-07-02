"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TEMPLATES = [
  { id: "moda", label: "Moda & Estilo", emoji: "👗", desc: "Elegante, minimalista", cor: "#c9a96e", bg: "#1a1a1a" },
  { id: "fitness", label: "Suplementos & Fitness", emoji: "💪", desc: "Energético, bold", cor: "#f97316", bg: "#0a0a0a" },
  { id: "eco", label: "Ecológico & Natural", emoji: "🌿", desc: "Tons terra, calmo", cor: "#a8c5a0", bg: "#2d4a3e" },
  { id: "tech", label: "Tecnologia", emoji: "💻", desc: "Moderno, técnico", cor: "#3b82f6", bg: "#0f172a" },
  { id: "geral", label: "Geral", emoji: "🛍️", desc: "Versátil, neutro", cor: "#6366f1", bg: "#1e293b" },
];

const TEMPLATE_CORES: Record<string, { corPrimaria: string; corSecundaria: string }> = {
  moda:    { corPrimaria: "#1a1a1a", corSecundaria: "#c9a96e" },
  fitness: { corPrimaria: "#0a0a0a", corSecundaria: "#f97316" },
  eco:     { corPrimaria: "#2d4a3e", corSecundaria: "#a8c5a0" },
  tech:    { corPrimaria: "#0f172a", corSecundaria: "#3b82f6" },
  geral:   { corPrimaria: "#1e293b", corSecundaria: "#6366f1" },
};

export default function OnboardingPage() {
  const { update } = useSession();
  const router = useRouter();

  const [step, setStep] = useState<"template" | "loja" | "loading">("template");
  const [templateSel, setTemplateSel] = useState("geral");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCriarLoja(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const nome = form.get("nome") as string;
    const subdominio = form.get("subdominio") as string;
    const cores = TEMPLATE_CORES[templateSel];

    const res = await fetch("/api/loja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        subdominio,
        tipoNegocio: templateSel,
        ...cores,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      if (data.erro === "subdominio-em-uso") setErro("Este subdomínio já está em uso. Escolha outro.");
      else setErro("Erro ao criar a loja. Tente novamente.");
      return;
    }

    setStep("loading");
    // Dispara update() — o JWT callback vai buscar o lojaId à DB
    await update({});
    // Pequena pausa para garantir que o cookie é escrito
    await new Promise((r) => setTimeout(r, 800));
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="text-xl font-bold text-slate-900 mb-10">
        Link<span className="text-indigo-600">Commerce</span>
      </Link>

      <div className="w-full max-w-2xl">

        {/* STEP: Template */}
        {step === "template" && (
          <div>
            <div className="text-center mb-8">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Passo 1 de 2</p>
              <h1 className="text-2xl font-bold text-slate-900">Escolha o estilo da sua loja</h1>
              <p className="mt-1 text-sm text-slate-500">Pode personalizar as cores mais tarde em Configurações.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateSel(t.id)}
                  className={`rounded-2xl border-2 overflow-hidden text-left transition-all ${templateSel === t.id ? "border-indigo-600 shadow-lg shadow-indigo-100" : "border-slate-200 hover:border-slate-300"}`}
                >
                  {/* Preview de cores */}
                  <div className="h-20 flex" style={{ backgroundColor: t.bg }}>
                    <div className="w-1/3 opacity-60" style={{ backgroundColor: t.cor }} />
                    <div className="flex-1 flex flex-col justify-end p-2 gap-1">
                      <div className="h-1.5 rounded-full bg-white/30 w-3/4" />
                      <div className="h-1.5 rounded-full bg-white/20 w-1/2" />
                    </div>
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-sm font-semibold text-slate-800">{t.emoji} {t.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep("loja")}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Continuar com {TEMPLATES.find(t => t.id === templateSel)?.label} →
            </button>
          </div>
        )}

        {/* STEP: Dados da loja */}
        {step === "loja" && (
          <div>
            <div className="text-center mb-8">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Passo 2 de 2</p>
              <h1 className="text-2xl font-bold text-slate-900">Detalhes da sua loja</h1>
              <p className="mt-1 text-sm text-slate-500">O endereço não pode ser alterado depois.</p>
            </div>

            {erro && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{erro}</div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <form onSubmit={handleCriarLoja} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome da loja</label>
                  <input name="nome" type="text" placeholder="Ex: Boutique da Ana" required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Endereço da loja</label>
                  <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                    <input name="subdominio" type="text" placeholder="boutique-ana" required pattern="[a-zA-Z0-9-]+"
                      className="flex-1 px-4 py-2.5 text-sm outline-none" />
                    <span className="flex items-center border-l border-slate-200 px-3 text-xs text-slate-400 bg-slate-50">.linkcommerce.app</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Apenas letras, números e hífens.</p>
                </div>

                {/* Preview do template selecionado */}
                <div className="rounded-xl overflow-hidden border border-slate-100">
                  <div className="h-8 flex items-center px-3 text-xs font-medium text-white" style={{ backgroundColor: TEMPLATE_CORES[templateSel].corPrimaria }}>
                    {TEMPLATES.find(t => t.id === templateSel)?.emoji} Template: {TEMPLATES.find(t => t.id === templateSel)?.label}
                  </div>
                  <div className="flex gap-2 p-3 bg-slate-50">
                    <span className="text-xs text-slate-500">Cor principal:</span>
                    <span className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="inline-block h-3 w-3 rounded-full border" style={{ backgroundColor: TEMPLATE_CORES[templateSel].corPrimaria }} />
                      {TEMPLATE_CORES[templateSel].corPrimaria}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="inline-block h-3 w-3 rounded-full border" style={{ backgroundColor: TEMPLATE_CORES[templateSel].corSecundaria }} />
                      {TEMPLATE_CORES[templateSel].corSecundaria}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => { setStep("template"); setErro(""); }}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                    ← Voltar
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                    {loading ? "A criar..." : "Lançar a minha loja 🚀"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STEP: Loading */}
        {step === "loading" && (
          <div className="text-center space-y-4 py-12">
            <div className="mx-auto h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">A lançar a sua loja…</h2>
            <p className="text-sm text-slate-500">Só um momento!</p>
          </div>
        )}

      </div>
    </div>
  );
}
