"use client";

import { useState, useTransition } from "react";
import { atualizarStatusPedido } from "../actions";

interface Props {
  pedidoId: string;
  statusAtual: string;
  trackingAtual: string;
  estadosPossiveis: { value: string; label: string }[];
  cor: string;
}

export function PedidoActions({ pedidoId, statusAtual, trackingAtual, estadosPossiveis, cor }: Props) {
  const [status, setStatus] = useState(statusAtual);
  const [tracking, setTracking] = useState(trackingAtual);
  const [sucesso, setSucesso] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleGuardar() {
    startTransition(async () => {
      await atualizarStatusPedido(pedidoId, status, tracking || undefined);
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    });
  }

  const alterado = status !== statusAtual || tracking !== trackingAtual;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h2 className="font-bold text-slate-800 mb-4">Gerir pedido</h2>

      <div className="space-y-4">
        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Estado do pedido
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          >
            {estadosPossiveis.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>

        {/* Tracking */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Número de tracking <span className="normal-case font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            type="text"
            placeholder="ex: PT123456789PT"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          />
        </div>

        {/* Botão */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleGuardar}
            disabled={isPending || !alterado}
            className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${cor}, ${cor}bb)` }}
          >
            {isPending
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A guardar…</>
              : "Guardar alterações"}
          </button>

          {sucesso && (
            <span className="text-green-600 text-sm font-semibold flex items-center gap-1">
              ✓ Guardado
            </span>
          )}
        </div>

        {/* Progresso visual */}
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Progresso</p>
          <div className="flex items-center">
            {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"].map((s, i, arr) => {
              const idxAtual = arr.indexOf(status);
              const passado = i <= idxAtual && status !== "CANCELLED";
              const eCancelado = status === "CANCELLED";
              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all
                    ${eCancelado ? "bg-red-100 text-red-400" : passado ? "text-white" : "bg-slate-100 text-slate-300"}`}
                    style={passado && !eCancelado ? { background: cor } : {}}>
                    {passado && !eCancelado ? "✓" : i + 1}
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${passado && i < idxAtual && !eCancelado ? "opacity-100" : "opacity-20"}`}
                      style={{ background: cor }} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1.5">
            {["Pendente", "Processo", "Enviado", "Entregue"].map((l) => (
              <span key={l} className="text-[9px] text-slate-400 font-medium">{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
