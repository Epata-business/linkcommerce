"use client";

import { useState } from "react";
import Link from "next/link";

const PLANS = [
  {
    key: "start",
    name: "Link Start",
    price: 1000,
    priceNote_pt: "no primeiro mês",
    priceNote_en: "first month",
    popular: false,
    target: "starter",
    cta_pt: "Criar Loja",
    cta_en: "Create Store",
    features_pt: [
      "Até 10 produtos",
      "Link na Bio",
      "Layout leve e rápido",
      "Suporte por email",
    ],
    features_en: [
      "Up to 10 products",
      "Bio Link",
      "Light & fast layout",
      "Email support",
    ],
  },
  {
    key: "growth",
    name: "Link Crescimento",
    price: 5000,
    priceNote_pt: "por mês",
    priceNote_en: "per month",
    popular: false,
    target: "starter",
    cta_pt: "Começar Agora",
    cta_en: "Get Started",
    features_pt: [
      "Até 50 produtos",
      "Automação WhatsApp",
      "Taxas de entrega por zona",
      "Relatórios básicos",
    ],
    features_en: [
      "Up to 50 products",
      "WhatsApp automation",
      "Delivery zones",
      "Basic reports",
    ],
  },
  {
    key: "pro",
    name: "Link Profissional",
    price: 12000,
    priceNote_pt: "por mês",
    priceNote_en: "per month",
    popular: true,
    target: "scale",
    cta_pt: "Escolher Plano",
    cta_en: "Choose Plan",
    features_pt: [
      "Produtos ilimitados",
      "Upload de comprovativo",
      "Cupões de desconto",
      "Pagamentos integrados",
      "Analytics avançado",
    ],
    features_en: [
      "Unlimited products",
      "Proof upload",
      "Discount coupons",
      "Integrated payments",
      "Advanced analytics",
    ],
  },
  {
    key: "premium",
    name: "Link Premium",
    price: 25000,
    priceNote_pt: "por mês",
    priceNote_en: "per month",
    popular: false,
    target: "scale",
    cta_pt: "Falar c/ Equipa",
    cta_en: "Talk to Us",
    features_pt: [
      "Domínio .COM incluído",
      "Suporte VIP prioritário",
      "3 Utilizadores",
      "White-label",
      "0% comissão por venda",
    ],
    features_en: [
      "Included .COM domain",
      "Priority VIP support",
      "3 Users",
      "White-label",
      "0% sales commission",
    ],
  },
];

function fmt(n: number) {
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

  const calcPrice = (base: number) =>
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
          const price = calcPrice(plan.price);
          const features = isEn ? plan.features_en : plan.features_pt;
          const cta = isEn ? plan.cta_en : plan.cta_pt;
          const note = isEn ? plan.priceNote_en : plan.priceNote_pt;

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
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-black text-white">{fmt(price)}</span>
                  </div>
                  <p className="text-xs text-white/35 mt-1">
                    {anual ? (isEn ? "billed annually" : "cobrado anualmente") : note}
                    {plan.key === "start" && !anual && (
                      <span className="ml-1 text-[#8381FB]">✦</span>
                    )}
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

      {/* Nota do Link Start */}
      <p className="text-center text-xs text-white/25 mt-8">
        <span className="text-[#8381FB]">✦</span>{" "}
        {isEn
          ? "Link Start: 1.000 Kz only in the first month. Renews at 2.500 Kz/month from the second month."
          : "Link Start: 1.000 Kz apenas no primeiro mês. Renova a 2.500 Kz/mês a partir do segundo mês."}
      </p>
    </div>
  );
}
