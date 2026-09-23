"use client";

import { useState } from "react";
import Link from "next/link";

// Preços em Kz para o mercado angolano (equivalência ~€1 = 1.200 Kz)
// O pagamento é processado em EUR via Stripe
const PLANS = [
  {
    key: "starter",
    name: "Starter",
    priceKz: 6000,
    priceEur: 5,
    popular: false,
    target: "starter",
    cta_pt: "Criar Loja",
    cta_en: "Create Store",
    commission_pt: "Comissão 2% por venda",
    commission_en: "2% commission per sale",
    features_pt: [
      "Até 50 produtos",
      "Loja online completa",
      "WhatsApp como CTA",
      "Suporte por email",
    ],
    features_en: [
      "Up to 50 products",
      "Full online store",
      "WhatsApp CTA",
      "Email support",
    ],
  },
  {
    key: "basic",
    name: "Basic",
    priceKz: 18000,
    priceEur: 15,
    popular: true,
    target: "starter",
    cta_pt: "Começar Agora",
    cta_en: "Get Started",
    commission_pt: "Comissão 1.5% por venda",
    commission_en: "1.5% commission per sale",
    features_pt: [
      "Até 200 produtos",
      "Domínio próprio",
      "Cupões de desconto",
      "Relatórios de vendas",
    ],
    features_en: [
      "Up to 200 products",
      "Custom domain",
      "Discount coupons",
      "Sales reports",
    ],
  },
  {
    key: "growth",
    name: "Growth",
    priceKz: 35000,
    priceEur: 29,
    popular: false,
    target: "scale",
    cta_pt: "Escolher Plano",
    cta_en: "Choose Plan",
    commission_pt: "Comissão 1% por venda",
    commission_en: "1% commission per sale",
    features_pt: [
      "Produtos ilimitados",
      "Domínio próprio",
      "Acesso à API",
      "Analytics avançado",
    ],
    features_en: [
      "Unlimited products",
      "Custom domain",
      "API access",
      "Advanced analytics",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    priceKz: 70000,
    priceEur: 59,
    popular: false,
    target: "scale",
    cta_pt: "Falar c/ Equipa",
    cta_en: "Talk to Us",
    commission_pt: "0% comissão por venda",
    commission_en: "0% commission per sale",
    features_pt: [
      "Produtos ilimitados",
      "Domínio próprio",
      "White-label",
      "Acesso à API",
      "Suporte VIP prioritário",
    ],
    features_en: [
      "Unlimited products",
      "Custom domain",
      "White-label",
      "API access",
      "Priority VIP support",
    ],
  },
];

function fmtKz(n: number) {
  return n.toLocaleString("pt-AO") + " Kz";
}

interface Props {
  locale: string;
}

export function PricingSection({ locale }: Props) {
  const [anual, setAnual] = useState(false);
  const [filtro, setFiltro] = useState<"all" | "starter" | "scale">("all");

  const isEn = locale === "en";

  const visiblePlans =
    filtro === "all"
      ? PLANS
      : PLANS.filter((p) => p.target === filtro);

  const calcPriceKz = (base: number) =>
    anual ? Math.round(base * 12 * 0.85) : base;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Título */}
      <div className="text-center mb-10">
        <p className="text-xs font-semibold tracking-widest text-[#8381FB] uppercase mb-3">
          {isEn ? "Pricing" : "Preços"}
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold">
          {isEn ? "Start free, grow at your pace" : "Comece, cresça ao seu ritmo"}
        </h2>
        <p className="mt-3 text-white/40">
          {isEn ? "No surprises. Change plans whenever you want." : "Sem surpresas. Mude de plano quando quiser."}
        </p>
      </div>

      {/* Filtro "tamanho do negócio" */}
      <div className="flex flex-col items-center gap-4 mb-10">
        <p className="text-sm font-semibold text-white/60">
          {isEn ? "What is the size of your business today?" : "Qual é o tamanho do seu negócio hoje?"}
        </p>
        <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {[
            { id: "all",     label_pt: "Ver todos",          label_en: "See all" },
            { id: "starter", label_pt: "Estou a começar",    label_en: "Just starting out" },
            { id: "scale",   label_pt: "Já vendo muito",     label_en: "Already selling a lot" },
          ].map((op) => (
            <button
              key={op.id}
              onClick={() => setFiltro(op.id as typeof filtro)}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={
                filtro === op.id
                  ? { background: "linear-gradient(135deg,#153DEC,#8381FB)", color: "#fff", boxShadow: "0 0 20px rgba(21,61,236,0.4)" }
                  : { color: "rgba(255,255,255,0.45)" }
              }
            >
              {isEn ? op.label_en : op.label_pt}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle Mensal / Anual */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span className={`text-sm font-semibold transition-colors ${!anual ? "text-white" : "text-white/40"}`}>
          {isEn ? "Monthly" : "Mensal"}
        </span>
        <button
          onClick={() => setAnual((a) => !a)}
          className="relative w-14 h-7 rounded-full transition-all"
          style={{ background: anual ? "linear-gradient(135deg,#153DEC,#8381FB)" : "rgba(255,255,255,0.12)" }}
        >
          <span
            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all"
            style={{ left: anual ? "calc(100% - 24px)" : "4px" }}
          />
        </button>
        <span className={`text-sm font-semibold transition-colors flex items-center gap-2 ${anual ? "text-white" : "text-white/40"}`}>
          {isEn ? "Annual" : "Anual"}
          <span className="text-[10px] font-bold rounded-full px-2 py-0.5 text-white" style={{ background: "#22c55e" }}>
            -15%
          </span>
        </span>
      </div>

      {/* Cards de planos */}
      <div className={`grid gap-5 transition-all ${visiblePlans.length === 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : visiblePlans.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto" : "grid-cols-1 max-w-sm mx-auto"}`}>
        {visiblePlans.map((plan) => {
          const priceKz = calcPriceKz(plan.priceKz);
          const features = isEn ? plan.features_en : plan.features_pt;
          const cta = isEn ? plan.cta_en : plan.cta_pt;

          return (
            <div
              key={plan.key}
              className="relative rounded-2xl flex flex-col"
              style={
                plan.popular
                  ? { background: "linear-gradient(145deg,rgba(21,61,236,0.18),rgba(131,129,251,0.12))", border: "1px solid rgba(131,129,251,0.4)", boxShadow: "0 0 40px rgba(21,61,236,0.2)" }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }
              }
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white"
                  style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)" }}>
                  {isEn ? "Most Popular" : "Mais Popular"}
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                <p className="text-xs font-bold tracking-widest uppercase text-white/40 mb-1">{plan.name}</p>

                <div className="my-4">
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-white">{fmtKz(priceKz)}</span>
                  </div>
                  <p className="text-xs text-white/35 mt-1 flex items-center gap-1.5">
                    {anual ? (isEn ? "billed annually" : "cobrado anualmente") : (isEn ? "per month" : "por mês")}
                    <span className="opacity-50">·</span>
                    <span className="font-mono">≈ €{plan.priceEur}</span>
                  </p>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="mt-0.5 text-green-400 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/comecar"
                  className="block text-center rounded-xl py-3 text-sm font-bold transition-all hover:scale-105 hover:opacity-90"
                  style={
                    plan.popular
                      ? { background: "linear-gradient(135deg,#153DEC,#8381FB)", color: "#fff", boxShadow: "0 0 24px rgba(21,61,236,0.4)" }
                      : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.1)" }
                  }
                >
                  {cta}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-center text-xs text-white/25">
          {isEn
            ? "Prices shown in Kz (≈ equivalent) · Charged in EUR via Stripe · Cancel anytime"
            : "Preços em Kz (equivalência aprox.) · Cobrado em EUR via Stripe · Cancele quando quiser"}
        </p>
        {/* Nota de transferência bancária */}
        <a
          href="https://wa.me/244900000000"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all hover:opacity-80"
          style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.25)", color: "#25D366" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {isEn ? "No international card? Pay via bank transfer — talk to us" : "Sem cartão internacional? Pague via transferência bancária — fale connosco"}
        </a>
      </div>
    </div>
  );
}
