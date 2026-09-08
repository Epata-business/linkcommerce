"use client";

import { useState, useRef } from "react";
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

interface DadosBancarios {
  titular: string;
  nba: string;
  iban: string;
  bic: string;
  banco: string;
}

interface Props {
  planos: Plano[];
  planoAtualId: string | null;
  temSubscricaoStripe: boolean;
  statusSubscricao: string | null;
  proximaCobranca: string | null;
  moedaLoja: string;
  dadosBancarios: DadosBancarios;
  isOnboarding?: boolean;
}

const PLANO_HIGHLIGHT: Record<string, string> = {
  basic: "border-blue-400 ring-2 ring-blue-100 shadow-lg",
};

const PLANO_BADGE: Record<string, { texto: string; cor: string }> = {
  basic: { texto: "Mais popular", cor: "bg-blue-600 text-white" },
  pro: { texto: "Para grandes empresas", cor: "bg-slate-800 text-white" },
};

// Preços em AOA (kwanzas) por plano
const PRECO_AOA: Record<string, number> = {
  free: 1000,
  starter: 4500,
  basic: 13500,
  growth: 26000,
  pro: 53000,
};

export function BillingCards({ planos, planoAtualId, temSubscricaoStripe, statusSubscricao, proximaCobranca, moedaLoja, dadosBancarios, isOnboarding }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Estado do fluxo AOA
  const [planoAoaId, setPlanoAoaId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [comprovanteUrl, setComprovanteUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isAOA = moedaLoja === "AOA";

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

  async function handleUploadComprovativo(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload-comprovativo", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) setComprovanteUrl(data.url);
      else alert("Erro ao enviar comprovativo.");
    } catch {
      alert("Erro ao enviar comprovativo.");
    }
    setUploading(false);
  }

  async function handleEnviarTransferencia() {
    if (!planoAoaId || !comprovanteUrl) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/billing/transferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planoId: planoAoaId, comprovanteUrl }),
      });
      if (res.ok) {
        router.refresh();
        setPlanoAoaId(null);
        setComprovanteUrl(null);
      } else {
        alert("Erro ao submeter transferência.");
      }
    } catch {
      alert("Erro ao submeter transferência.");
    }
    setEnviando(false);
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

      {/* Aviso subscrição AOA pendente */}
      {statusSubscricao === "PENDENTE_TRANSFERENCIA" && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
          <p className="text-amber-800 font-bold">⏳ Transferência em análise</p>
          <p className="text-amber-700 text-sm mt-1">O seu comprovativo foi recebido. A equipa LinkCommerce irá activar o plano em até 24 horas úteis.</p>
        </div>
      )}

      {/* Cards dos planos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {planos.map((plano) => {
          const isAtual = plano.id === planoAtualId;
          const highlight = PLANO_HIGHLIGHT[plano.slug] ?? "border-slate-200";
          const badge = PLANO_BADGE[plano.slug];
          const isFree = plano.precoMensal === 0 || plano.slug === "free";
          const precoExibir = isAOA
            ? `${(PRECO_AOA[plano.slug] ?? 0).toLocaleString("pt-AO")} Kz`
            : `€${plano.precoMensal}`;

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
                  <p className="text-2xl font-black text-slate-900">{isAOA ? "1.000 Kz" : "1€"}<span className="text-sm font-normal text-slate-400">/mês</span></p>
                ) : (
                  <p className="text-2xl font-black text-slate-900">
                    {precoExibir}
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
                isOnboarding ? (
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full rounded-xl py-2.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors">
                    Continuar gratuitamente →
                  </button>
                ) : (
                  <button disabled className="w-full rounded-xl py-2.5 text-sm font-bold bg-slate-50 text-slate-400 border border-slate-200 cursor-default">
                    Sempre disponível
                  </button>
                )
              ) : isAOA ? (
                <button
                  onClick={() => setPlanoAoaId(plano.id)}
                  className="w-full rounded-xl py-2.5 text-sm font-bold text-white bg-blue-600 hover:opacity-90 transition-all active:scale-95">
                  Transferência bancária
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
                    ${plano.slug === "basic" ? "bg-blue-600" : "bg-slate-900"}`}>
                  {loading === plano.id ? "A redirecionar…" : "Escolher plano"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de transferência AOA */}
      {planoAoaId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Pagamento por transferência bancária</h3>
            <p className="text-sm text-slate-500 mb-5">Transfira o valor do plano para a conta abaixo e envie o comprovativo.</p>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Titular</span>
                <span className="font-semibold text-slate-800">{dadosBancarios.titular}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Banco</span>
                <span className="font-semibold text-slate-800">{dadosBancarios.banco}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IBAN</span>
                <span className="font-semibold text-slate-800 font-mono">{dadosBancarios.iban}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NBA</span>
                <span className="font-semibold text-slate-800 font-mono">{dadosBancarios.nba}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">BIC/SWIFT</span>
                <span className="font-semibold text-slate-800 font-mono">{dadosBancarios.bic}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                <span className="text-slate-500">Valor</span>
                <span className="font-black text-blue-600">
                  {(PRECO_AOA[planos.find(p => p.id === planoAoaId)?.slug ?? ""] ?? 0).toLocaleString("pt-AO")} Kz/mês
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-3">Na descrição da transferência escreva: <strong>LinkCommerce - {planos.find(p => p.id === planoAoaId)?.nome}</strong></p>

            {/* Upload comprovativo */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Comprovativo de pagamento</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadComprovativo(f); }}
              />
              {comprovanteUrl ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
                  <span className="text-green-600 font-bold text-lg">✓</span>
                  <span className="text-green-700 text-sm font-semibold">Comprovativo carregado</span>
                  <button onClick={() => setComprovanteUrl(null)} className="ml-auto text-slate-400 hover:text-slate-600 text-xs">remover</button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full rounded-xl border-2 border-dashed border-slate-200 py-4 text-sm text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors disabled:opacity-60">
                  {uploading ? "A enviar…" : "📎 Clique para anexar imagem ou PDF"}
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setPlanoAoaId(null); setComprovanteUrl(null); }}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
              <button
                onClick={handleEnviarTransferencia}
                disabled={!comprovanteUrl || enviando}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-all">
                {enviando ? "A enviar…" : "Enviar comprovativo"}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-400 mt-8">
        {isAOA
          ? "Pagamentos processados por transferência bancária · Activação em até 24h úteis"
          : "Pagamentos processados em segurança pela Stripe · Pode cancelar a qualquer momento"}
      </p>
    </div>
  );
}

const statusMap: Record<string, string> = {
  TRIAL: "Período de teste",
  PENDENTE_TRANSFERENCIA: "Transferência em análise",
  ATIVA: "Activa",
  EM_FALTA: "Pagamento em falta",
  CANCELADA: "Cancelada",
};
