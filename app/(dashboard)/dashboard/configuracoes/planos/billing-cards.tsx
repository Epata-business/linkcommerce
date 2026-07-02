"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Plano {
  id: string;
  nome: string;
  slug: string;
  precoMensal: number;
  comissaoPercentual: number;
  limiteProdutos: number | null;
  permiteDominioProprio: boolean;
  permiteApiAccess: boolean;
  permiteWhiteLabel: boolean;
  stripePriceId: string | null;
  ordem: number;
}

interface Props {
  planos: Plano[];
  planoAtualId: string | null;
  temSubscricaoStripe: boolean;
  statusSubscricao: string | null;
  proximaCobranca: string | null;
}

const PLANO_HIGHLIGHT: Record<string, string> = {
  growth: "border-blue-400 ring-2 ring-blue-100 shadow-lg",
};

const PLANO_BADGE: Record<string, { texto: string; cor: string }> = {
  growth: { texto: "Mais popular", cor: "bg-blue-600 text-white" },
  enterprise: { texto: "Para grandes empresas", cor: "bg-slate-800 text-white" },
};

export function BillingCards({ planos, planoAtualId, temSubscricaoStripe, statusSubscricao, proximaCobranca }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleSubscribe(planoId: string) {
    setLoading(planoId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planoId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Erro ao iniciar checkout. Tente novamente.");
    }
    setLoading(null);
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Erro ao abrir portal. Tente novamente.");
    }
    setPortalLoading(false);
  }

  return (
    <div>
      {/* Info subscrição activa */}
      {temSubscricaoStripe && proximaCobranca && (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Subscrição activa</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Próxima cobrança: {new Date(proximaCobranca).toLocaleDateString("pt-PT")}
              {statusSubscricao && ` · ${statusMap[statusSubscricao] ?? statusSubscricao}`}
            </p>
          </div>
          <button onClick={handlePortal} disabled={portalLoading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60">
            {portalLoading ? "A abrir…" : "Gerir subscrição →"}
          </button>
        </div>
      )}

      {/* Cards dos planos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {planos.map((plano) => {
          const isAtual = plano.id === planoAtualId;
          const highlight = PLANO_HIGHLIGHT[plano.slug] ?? "border-slate-200";
          const badge = PLANO_BADGE[plano.slug];
          const isFree = plano.precoMensal === 0;

          return (
            <div key={plano.id}
              className={`flex flex-col rounded-2xl border p-5 bg-white transition-all relative ${isAtual ? "border-green-400 ring-2 ring-green-100" : highlight}`}>

              {isAtual && (
                <span className="absolute -top-3 left-4 rounded-full bg-green-500 text-white text-xs font-bold px-3 py-1">
                  Plano actual ✓
                </span>
              )}
              {!isAtual && badge && (
                <span className={`absolute -top-3 left-4 rounded-full text-xs font-bold px-3 py-1 ${badge.cor}`}>
                  {badge.texto}
                </span>
              )}

              <h2 className="text-lg font-bold text-slate-900 mt-1">{plano.nome}</h2>
              <div className="mt-3 mb-4">
                {isFree ? (
                  <p className="text-3xl font-black text-slate-900">Grátis</p>
                ) : (
                  <p className="text-3xl font-black text-slate-900">
                    €{plano.precoMensal}
                    <span className="text-sm font-normal text-slate-400">/mês</span>
                  </p>
                )}
              </div>

              <ul className="flex-1 space-y-2 text-sm text-slate-600 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  {plano.limiteProdutos ? `Até ${plano.limiteProdutos} produtos` : "Produtos ilimitados"}
                </li>
                <li className="flex items-start gap-2">
                  <span className={plano.comissaoPercentual > 0 ? "text-amber-400 font-bold mt-0.5" : "text-green-500 font-bold mt-0.5"}>
                    {plano.comissaoPercentual > 0 ? "!" : "✓"}
                  </span>
                  Comissão {plano.comissaoPercentual}% por venda
                </li>
                <li className={`flex items-start gap-2 ${!plano.permiteDominioProprio ? "text-slate-300" : ""}`}>
                  <span className={plano.permiteDominioProprio ? "text-green-500 font-bold mt-0.5" : "text-slate-300 mt-0.5"}>
                    {plano.permiteDominioProprio ? "✓" : "✗"}
                  </span>
                  Domínio próprio
                </li>
                <li className={`flex items-start gap-2 ${!plano.permiteApiAccess ? "text-slate-300" : ""}`}>
                  <span className={plano.permiteApiAccess ? "text-green-500 font-bold mt-0.5" : "text-slate-300 mt-0.5"}>
                    {plano.permiteApiAccess ? "✓" : "✗"}
                  </span>
                  Acesso à API
                </li>
                <li className={`flex items-start gap-2 ${!plano.permiteWhiteLabel ? "text-slate-300" : ""}`}>
                  <span className={plano.permiteWhiteLabel ? "text-green-500 font-bold mt-0.5" : "text-slate-300 mt-0.5"}>
                    {plano.permiteWhiteLabel ? "✓" : "✗"}
                  </span>
                  White-label
                </li>
              </ul>

              {isAtual ? (
                <button disabled className="w-full rounded-xl py-2.5 text-sm font-bold bg-slate-100 text-slate-400 cursor-default">
                  Plano actual
                </button>
              ) : isFree ? (
                <button disabled className="w-full rounded-xl py-2.5 text-sm font-bold bg-slate-50 text-slate-400 border border-slate-200 cursor-default">
                  Sempre disponível
                </button>
              ) : !plano.stripePriceId ? (
                <button disabled className="w-full rounded-xl py-2.5 text-sm font-bold bg-slate-100 text-slate-400 cursor-default">
                  Em breve
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plano.id)}
                  disabled={loading !== null}
                  className={`w-full rounded-xl py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60
                    ${plano.slug === "growth" ? "bg-blue-600" : "bg-slate-900"}`}>
                  {loading === plano.id ? "A redirecionar…" : "Escolher plano"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Nota */}
      <p className="text-center text-xs text-slate-400 mt-8">
        Pagamentos processados em segurança pela Stripe · Pode cancelar a qualquer momento
      </p>
    </div>
  );
}

const statusMap: Record<string, string> = {
  TRIAL: "Período de teste",
  ATIVA: "Activa",
  EM_FALTA: "Pagamento em falta",
  CANCELADA: "Cancelada",
};
