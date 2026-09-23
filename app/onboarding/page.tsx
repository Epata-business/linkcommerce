"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Sugestões de nome por nicho e paleta ────────────────────────────────────
const SUGESTOES_NOME: Record<string, string[]> = {
  moda:        ["Milano Chic Angola", "Boutique Elegance Luanda", "KilimbaStyle", "Afro Couture AO"],
  beleza:      ["Studio Glamour Luanda", "Barbearia Executive AO", "Natural Glow Spa", "Neon Cuts Luanda"],
  alimentacao: ["Rulote Grelha d'Ouro", "Doce Pedaço Luanda", "Chef à Domicílio AO", "Fit Marmitas Angola"],
  imoveis:     ["Talatona Prime Imóveis", "Meu Lar Angola", "Construção Forte AO", "Modern Living Luanda"],
  fitness:     ["PowerZone Angola", "Strong & Cut Luanda", "ElectricPump AO", "NutriClean Angola"],
  eco:         ["Floresta Verde AO", "Terra Viva Angola", "Oceano Calmo Luanda", "Sol & Campo AO"],
  tech:        ["TechBlue Angola", "DarkCode Luanda", "FutureLab AO", "ElectricShop Angola"],
  geral:       ["Vitrina Angola", "Loja Premium AO", "Catálogo Âmbar", "Shop Luanda"],
};

// ── Nichos ──────────────────────────────────────────────────────────────────
const NICHOS = [
  { id: "moda",        label: "Moda & Boutique",        emoji: "👗", desc: "Vestuário, calçado, acessórios" },
  { id: "beleza",      label: "Beleza & Barbearia",      emoji: "💅", desc: "Salões, estética, cosméticos" },
  { id: "alimentacao", label: "Alimentação & Confeitaria", emoji: "🍽️", desc: "Restaurantes, bolos, marmitas" },
  { id: "imoveis",     label: "Imobiliária",              emoji: "🏠", desc: "Corretores, arrendamentos, obras" },
  { id: "fitness",     label: "Fitness & Suplementos",   emoji: "💪", desc: "Treino, nutrição, saúde" },
  { id: "eco",         label: "Ecológico & Natural",     emoji: "🌿", desc: "Produtos orgânicos, artesanato" },
  { id: "tech",        label: "Tecnologia",              emoji: "💻", desc: "Gadgets, serviços digitais" },
  { id: "geral",       label: "Geral / Outro",           emoji: "🛍️", desc: "Versátil para qualquer produto" },
];

// ── Paletas por nicho (4 por nicho) ─────────────────────────────────────────
const PALETAS: Record<string, Array<{
  nome: string;
  desc: string;
  corPrimaria: string;
  corSecundaria: string;
}>> = {
  moda: [
    { nome: "Boutique Luanda",     desc: "Clássico elegante — festas & joias",         corPrimaria: "#111111", corSecundaria: "#C9A96E" },
    { nome: "Terra Mãe",           desc: "Orgânico & minimalista — moda sustentável",   corPrimaria: "#6B4F35", corSecundaria: "#F2EBD9" },
    { nome: "Streetwear Kilamba",  desc: "Urbano & jovem — ténis e bonés",              corPrimaria: "#374151", corSecundaria: "#2563EB" },
    { nome: "Afro-Chic",           desc: "Cultura vibrante — panos africanos",          corPrimaria: "#1C1917", corSecundaria: "#D97706" },
  ],
  beleza: [
    { nome: "Pele de Seda",        desc: "Suave & clean — estética feminina",           corPrimaria: "#BE185D", corSecundaria: "#FCE7F3" },
    { nome: "Executive Gentleman", desc: "Barbearia premium — cortes clássicos",        corPrimaria: "#111827", corSecundaria: "#92400E" },
    { nome: "Natural Glow",        desc: "Frescor & saúde — spa e cosméticos naturais", corPrimaria: "#059669", corSecundaria: "#D1FAE5" },
    { nome: "Neon Barber",         desc: "Jovem & artístico — barbearias modernas",     corPrimaria: "#1F2937", corSecundaria: "#F97316" },
  ],
  alimentacao: [
    { nome: "Churrasco & Brasa",   desc: "Rústico & forte — burgers e grelhados",       corPrimaria: "#DC2626", corSecundaria: "#F59E0B" },
    { nome: "Doce Pedaço",         desc: "Delicado — confeitaria e bolos",              corPrimaria: "#7C3AED", corSecundaria: "#FDE8F6" },
    { nome: "Gourmet Luandense",   desc: "Requintado — catering e alta gastronomia",    corPrimaria: "#1E3A5F", corSecundaria: "#D4AF37" },
    { nome: "Natural & Saudável",  desc: "Fit & fresco — sumos e marmitas fitness",     corPrimaria: "#16A34A", corSecundaria: "#FBBF24" },
  ],
  imoveis: [
    { nome: "Altos Padrões",       desc: "Corporativo premium — imóveis de luxo",       corPrimaria: "#1E3A5F", corSecundaria: "#94A3B8" },
    { nome: "Meu Lar",             desc: "Acolhedor — vivendas e terrenos familiares",  corPrimaria: "#4D7C0F", corSecundaria: "#FEF3C7" },
    { nome: "Construção Forte",    desc: "Técnico — empreiteiros e materiais",          corPrimaria: "#111827", corSecundaria: "#F59E0B" },
    { nome: "Modern Living",       desc: "Minimalista — apartamentos estúdio",          corPrimaria: "#0891B2", corSecundaria: "#F0F9FF" },
  ],
  fitness: [
    { nome: "Power Zone",          desc: "Energia máxima — suplementos e treino",       corPrimaria: "#DC2626", corSecundaria: "#F97316" },
    { nome: "Strong & Dark",       desc: "Premium escuro — academias de alto rendimento", corPrimaria: "#111827", corSecundaria: "#EF4444" },
    { nome: "Electric Pump",       desc: "Vibrante — crossfit e desafios",              corPrimaria: "#7C3AED", corSecundaria: "#06B6D4" },
    { nome: "Clean Athlete",       desc: "Limpo & profissional — nutrição e saúde",     corPrimaria: "#0F766E", corSecundaria: "#FCD34D" },
  ],
  eco: [
    { nome: "Floresta Densa",      desc: "Sombrio & natural — botânica e artesanato",   corPrimaria: "#14532D", corSecundaria: "#A8C5A0" },
    { nome: "Terra Viva",          desc: "Tons terra quentes — orgânicos e mel",        corPrimaria: "#78350F", corSecundaria: "#D9F99D" },
    { nome: "Oceano Calmo",        desc: "Frescor aquático — cosméticos naturais",      corPrimaria: "#0369A1", corSecundaria: "#BAE6FD" },
    { nome: "Sol & Campo",         desc: "Solar & alegre — frutas e mercados locais",   corPrimaria: "#15803D", corSecundaria: "#FDE047" },
  ],
  tech: [
    { nome: "Deep Blue Tech",      desc: "Corporativo — software e consultoria",        corPrimaria: "#1E3A8A", corSecundaria: "#60A5FA" },
    { nome: "Dark Code",           desc: "Hacker chique — gadgets e acessórios",        corPrimaria: "#030712", corSecundaria: "#22D3EE" },
    { nome: "Gradient Future",     desc: "Moderno — apps, startups e SaaS",             corPrimaria: "#4F46E5", corSecundaria: "#818CF8" },
    { nome: "Electric White",      desc: "Minimalista técnico — electrónica",           corPrimaria: "#0F172A", corSecundaria: "#38BDF8" },
  ],
  geral: [
    { nome: "Índigo Clássico",     desc: "Universal — funciona em qualquer nicho",      corPrimaria: "#4338CA", corSecundaria: "#818CF8" },
    { nome: "Esmeralda",           desc: "Confiança & crescimento",                     corPrimaria: "#059669", corSecundaria: "#34D399" },
    { nome: "Âmbar Premium",       desc: "Quente & acolhedor",                          corPrimaria: "#B45309", corSecundaria: "#FCD34D" },
    { nome: "Ardósia Moderno",     desc: "Neutro & sofisticado",                        corPrimaria: "#334155", corSecundaria: "#94A3B8" },
  ],
};

export default function OnboardingPage() {
  const { update } = useSession();

  const [step, setStep] = useState<"template" | "loja" | "loading">("template");
  const [nichoSel, setNichoSel] = useState<string | null>(null);
  const [paletaSel, setPaletaSel] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  function handleEscolherNicho(id: string) {
    setNichoSel(id);
    setPaletaSel(0); // pré-selecciona a primeira paleta
  }

  const paletasNicho = nichoSel ? PALETAS[nichoSel] ?? [] : [];
  const paletaActual = paletaSel !== null ? paletasNicho[paletaSel] : null;

  async function handleCriarLoja(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const nome = form.get("nome") as string;
    const subdominio = form.get("subdominio") as string;

    const res = await fetch("/api/loja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        subdominio,
        tipoNegocio: nichoSel ?? "geral",
        corPrimaria: paletaActual?.corPrimaria ?? "#4338CA",
        corSecundaria: paletaActual?.corSecundaria ?? "#818CF8",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      if (data.erro === "subdominio-em-uso") setErro("Este subdomínio já está em uso. Escolha outro.");
      else if (data.erro === "ja-tem-loja") {
        setStep("loading");
        await update({});
        await new Promise((r) => setTimeout(r, 600));
        window.location.href = "/subscrever";
        return;
      } else setErro("Erro ao criar a loja. Tente novamente.");
      return;
    }

    setStep("loading");
    await update({});
    await new Promise((r) => setTimeout(r, 600));
    window.location.href = "/subscrever";
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-start px-4 py-10">

      {/* Logo */}
      <Link href="/" className="text-lg font-bold text-slate-900 mb-8 tracking-tight">
        Link<span className="text-indigo-600">Commerce</span>
      </Link>

      <div className="w-full max-w-2xl">

        {/* ── STEP 1: Nicho + Paleta ── */}
        {step === "template" && (
          <div>
            {/* Header */}
            <div className="mb-7">
              <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-[0.12em] mb-2">
                Passo 1 de 2
              </p>
              <h1 className="text-[26px] font-bold text-slate-900 leading-tight">
                Qual é o tipo do seu negócio?
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Escolha o seu nicho — vamos sugerir um estilo visual profissional para a sua loja.
              </p>
            </div>

            {/* Grid de nichos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
              {NICHOS.map((n) => {
                const sel = nichoSel === n.id;
                return (
                  <button key={n.id} type="button" onClick={() => handleEscolherNicho(n.id)}
                    className={`group rounded-2xl border-2 p-3.5 text-left transition-all duration-150 ${
                      sel
                        ? "border-indigo-500 bg-indigo-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm"
                    }`}>
                    <span className="text-xl block mb-2 leading-none">{n.emoji}</span>
                    <p className={`text-[11px] font-bold leading-snug ${sel ? "text-indigo-700" : "text-slate-800"}`}>
                      {n.label}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{n.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Paletas — aparecem ao seleccionar nicho */}
            {nichoSel && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-4">
                  Escolha o estilo visual —{" "}
                  <span className="text-indigo-600">{NICHOS.find(n => n.id === nichoSel)?.label}</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {paletasNicho.map((p, i) => {
                    const sel = paletaSel === i;
                    return (
                      <button key={i} type="button" onClick={() => setPaletaSel(i)}
                        className={`rounded-xl border-2 overflow-hidden text-left transition-all duration-150 ${
                          sel ? "border-indigo-500 shadow-md shadow-indigo-100" : "border-slate-200 hover:border-slate-300"
                        }`}>

                        {/* Mini-mockup de loja */}
                        <div className="relative" style={{ backgroundColor: p.corPrimaria }}>
                          {/* Header simulado */}
                          <div className="px-3 pt-3 pb-2 flex items-center justify-between">
                            <div className="flex gap-1">
                              <div className="h-1.5 w-8 rounded-full opacity-40" style={{ backgroundColor: p.corSecundaria }} />
                              <div className="h-1.5 w-5 rounded-full opacity-25" style={{ backgroundColor: p.corSecundaria }} />
                            </div>
                            <div className="h-4 w-4 rounded-full opacity-30" style={{ backgroundColor: p.corSecundaria }} />
                          </div>
                          {/* Produto card simulado */}
                          <div className="mx-2 mb-2 rounded-lg p-2" style={{ backgroundColor: "rgba(255,255,255,0.10)" }}>
                            <div className="h-6 rounded mb-1.5 opacity-20 bg-white" />
                            <div className="flex items-center justify-between">
                              <div className="h-1.5 w-10 rounded-full opacity-30 bg-white" />
                              <div className="h-4 w-8 rounded-md text-[6px] font-bold flex items-center justify-center"
                                style={{ backgroundColor: p.corSecundaria, color: p.corPrimaria }}>
                                BUY
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Info */}
                        <div className={`p-2.5 flex items-start justify-between gap-1 ${sel ? "bg-indigo-50" : "bg-white"}`}>
                          <div>
                            <p className={`text-[11px] font-bold leading-tight ${sel ? "text-indigo-700" : "text-slate-800"}`}>
                              {p.nome}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{p.desc}</p>
                          </div>
                          {sel && (
                            <div className="flex-shrink-0 mt-0.5 h-4 w-4 rounded-full bg-indigo-600 flex items-center justify-center">
                              <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Chips de cor da paleta seleccionada */}
                {paletaActual && (
                  <div className="mt-4 flex items-center gap-3 px-1">
                    <span className="text-[10px] text-slate-400 font-medium">Cores:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded-full border border-black/10 shadow-sm"
                          style={{ backgroundColor: paletaActual.corPrimaria }} />
                        <span className="text-[10px] text-slate-500 font-mono">{paletaActual.corPrimaria}</span>
                      </div>
                      <span className="text-slate-300">·</span>
                      <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded-full border border-black/10 shadow-sm"
                          style={{ backgroundColor: paletaActual.corSecundaria }} />
                        <span className="text-[10px] text-slate-500 font-mono">{paletaActual.corSecundaria}</span>
                      </div>
                    </div>
                    <span className="ml-auto text-[10px] text-slate-400">Personalizável depois</span>
                  </div>
                )}
              </div>
            )}

            <button onClick={() => { if (nichoSel && paletaSel !== null) setStep("loja"); }}
              disabled={!nichoSel || paletaSel === null}
              className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-35 disabled:cursor-not-allowed transition-colors shadow-sm">
              {nichoSel && paletaActual
                ? `Continuar com "${paletaActual.nome}" →`
                : "Seleccione o tipo de negócio para continuar"}
            </button>
          </div>
        )}

        {/* ── STEP 2: Dados da loja ── */}
        {step === "loja" && paletaActual && (
          <div>
            <div className="mb-7">
              <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-[0.12em] mb-2">Passo 2 de 2</p>
              <h1 className="text-[26px] font-bold text-slate-900 leading-tight">Dê um nome à sua loja</h1>
              <p className="mt-1.5 text-sm text-slate-500">O endereço não pode ser alterado depois de criado.</p>
            </div>

            {erro && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{erro}</div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              {/* Preview da paleta escolhida */}
              <div className="rounded-xl overflow-hidden border border-slate-100 mb-6">
                <div className="h-12 flex">
                  <div className="flex-1" style={{ backgroundColor: paletaActual.corPrimaria }} />
                  <div className="w-1/4" style={{ backgroundColor: paletaActual.corSecundaria }} />
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{NICHOS.find(n => n.id === nichoSel)?.emoji}</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-700 leading-tight">{paletaActual.nome}</p>
                      <p className="text-[10px] text-slate-400">{paletaActual.desc}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setStep("template"); setErro(""); }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
                    Alterar →
                  </button>
                </div>
              </div>

              <form onSubmit={handleCriarLoja} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome da loja</label>
                  <input name="nome" type="text" required
                    placeholder={
                      nichoSel && paletaSel !== null
                        ? `Ex: ${SUGESTOES_NOME[nichoSel]?.[paletaSel] ?? "A Minha Loja"}`
                        : "Ex: A Minha Loja"
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300" />
                  {nichoSel && paletaSel !== null && (
                    <p className="mt-1.5 text-xs text-slate-400">
                      Sugestão:{" "}
                      <strong className="text-indigo-600 cursor-pointer hover:underline"
                        onClick={(e) => {
                          const input = (e.currentTarget.closest("form") as HTMLFormElement)?.querySelector<HTMLInputElement>("[name=nome]");
                          if (input) input.value = SUGESTOES_NOME[nichoSel]?.[paletaSel] ?? "";
                        }}>
                        {SUGESTOES_NOME[nichoSel]?.[paletaSel]}
                      </strong>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Endereço da loja</label>
                  <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                    <input name="subdominio" type="text" placeholder="boutique-ana" required pattern="[a-zA-Z0-9-]+"
                      className="flex-1 px-4 py-3 text-sm outline-none placeholder:text-slate-300" />
                    <span className="flex items-center border-l border-slate-200 px-3 text-xs text-slate-400 bg-slate-50 whitespace-nowrap">.linkcommerce.cc</span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">Apenas letras, números e hífens. Não pode ser alterado depois.</p>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm mt-2">
                  {loading ? "A criar a loja…" : "Lançar a minha loja →"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {step === "loading" && (
          <div className="text-center space-y-4 py-16">
            <div className="mx-auto h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Loja criada com sucesso!</h2>
            <p className="text-sm text-slate-500">A preparar a escolha do plano…</p>
          </div>
        )}

      </div>
    </div>
  );
}
