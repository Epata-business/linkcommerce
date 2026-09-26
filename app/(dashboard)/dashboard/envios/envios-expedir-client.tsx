"use client";

import { useState } from "react";

interface PedidoProcessing {
  id: string;
  clienteNome: string | null;
  clienteEmail: string;
  morada: Record<string, string> | null;
  total: number;
  createdAt: string;
  zonaEntregaNome: string | null;
  itens: { titulo: string; quantidade: number }[];
}

interface PedidoShipped {
  id: string;
  clienteNome: string | null;
  clienteEmail: string;
  codigoRastreio: string | null;
  transportadora: string | null;
  total: number;
  updatedAt: string;
  zonaEntregaNome: string | null;
}

interface Props {
  pedidosProcessing: PedidoProcessing[];
  pedidosShipped: PedidoShipped[];
  moeda: string;
  cor: string;
  registarEnvio: (pedidoId: string, codigoRastreio: string, transportadora: string) => Promise<void>;
}

const TRANSPORTADORAS = [
  "DHL", "FedEx", "UPS", "CTT", "TNT", "GLS", "Nacex",
  "Correios Angola", "Expresso Angola", "Outra",
];

function formatarPreco(valor: number, moeda: string) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: moeda }).format(valor);
}

function EnviarForm({
  pedido,
  moeda,
  cor,
  onEnviar,
}: {
  pedido: PedidoProcessing;
  moeda: string;
  cor: string;
  onEnviar: (codigoRastreio: string, transportadora: string) => Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState("");
  const [transportadora, setTransportadora] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onEnviar(tracking, transportadora);
    } finally {
      setLoading(false);
    }
  }

  const moradaRua = pedido.morada?.rua ?? pedido.morada?.morada ?? "";
  const moradaCidade = pedido.morada?.cidade ?? "";
  const destinatario = [moradaRua, moradaCidade].filter(Boolean).join(", ");

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-slate-400">
              #{pedido.id.slice(-8).toUpperCase()}
            </span>
            <span className="text-xs text-slate-300">·</span>
            <span className="text-sm font-semibold text-slate-800">
              {pedido.clienteNome ?? pedido.clienteEmail}
            </span>
            {pedido.zonaEntregaNome && (
              <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
                {pedido.zonaEntregaNome}
              </span>
            )}
          </div>
          {destinatario && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">{destinatario}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {pedido.itens.map((item, i) => (
              <span key={i} className="text-xs text-slate-600 bg-slate-50 rounded px-2 py-0.5">
                {item.quantidade}× {item.titulo}
              </span>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-black text-slate-900 tabular-nums">
            {formatarPreco(pedido.total, moeda)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date(pedido.createdAt).toLocaleDateString("pt-PT")}
          </p>
        </div>
      </div>

      {!aberto ? (
        <div className="px-4 pb-4">
          <button
            onClick={() => setAberto(true)}
            className="w-full rounded-xl py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: cor }}
          >
            Registar envio →
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="border-t border-slate-50 px-4 py-4 space-y-3 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Transportadora
              </label>
              <select
                value={transportadora}
                onChange={e => setTransportadora(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Selecionar…</option>
                {TRANSPORTADORAS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Código de rastreio <span className="text-slate-300">(opcional)</span>
              </label>
              <input
                type="text"
                value={tracking}
                onChange={e => setTracking(e.target.value)}
                placeholder="ex: PT123456789PT"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: cor }}
            >
              {loading ? "A registar…" : "Confirmar envio"}
            </button>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="px-4 rounded-xl text-sm font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function EnviosExpedirClient({ pedidosProcessing, pedidosShipped, moeda, cor, registarEnvio }: Props) {
  const [tab, setTab] = useState<"expedir" | "enviados">("expedir");

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-100 p-1 w-fit mb-6 shadow-sm">
        {([
          { key: "expedir", label: `Por expedir (${pedidosProcessing.length})` },
          { key: "enviados", label: `Enviados (${pedidosShipped.length})` },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "expedir" && (
        <div className="space-y-3">
          {pedidosProcessing.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
              <p className="text-slate-400 text-sm">Nenhum pedido por expedir.</p>
              <p className="text-xs text-slate-300 mt-1">Pedidos pagos aguardando expedição aparecerão aqui.</p>
            </div>
          ) : (
            pedidosProcessing.map(p => (
              <EnviarForm
                key={p.id}
                pedido={p}
                moeda={moeda}
                cor={cor}
                onEnviar={(tracking, transportadora) => registarEnvio(p.id, tracking, transportadora)}
              />
            ))
          )}
        </div>
      )}

      {tab === "enviados" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {pedidosShipped.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Nenhum envio nos últimos 30 dias.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Pedido</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Transportadora</th>
                  <th className="px-4 py-3 text-left">Rastreio</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Enviado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pedidosShipped.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <a href={`/dashboard/pedidos/${p.id}`}
                        className="font-mono text-xs font-bold text-indigo-600 hover:text-indigo-800">
                        #{p.id.slice(-8).toUpperCase()}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 truncate max-w-[140px]">
                        {p.clienteNome ?? p.clienteEmail}
                      </p>
                      {p.zonaEntregaNome && (
                        <p className="text-xs text-slate-400">{p.zonaEntregaNome}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.transportadora ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {p.codigoRastreio ? (
                        <span className="font-mono text-xs bg-blue-50 text-blue-700 rounded px-2 py-0.5">
                          {p.codigoRastreio}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800 tabular-nums">
                      {formatarPreco(p.total, moeda)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400 tabular-nums">
                      {new Date(p.updatedAt).toLocaleDateString("pt-PT")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
