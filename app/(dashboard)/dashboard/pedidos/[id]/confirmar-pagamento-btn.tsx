"use client";

import { useTransition, useState } from "react";
import { atualizarStatusPedido } from "../actions";

interface Props {
  pedidoId: string;
  pagamentoId: string;
  valor: string;
  comprovanteUrl: string | null;
}

export function ConfirmarPagamentoBtn({ pedidoId, valor, comprovanteUrl }: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmado, setConfirmado] = useState(false);

  function confirmar() {
    startTransition(async () => {
      await atualizarStatusPedido(pedidoId, "PROCESSING");
      setConfirmado(true);
    });
  }

  if (confirmado) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-3">
        <span className="text-2xl">✓</span>
        <div>
          <p className="text-sm font-bold text-green-800">Pagamento confirmado</p>
          <p className="text-xs text-green-600 mt-0.5">Stock actualizado · Pedido em processamento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-900">🏦 Transferência bancária pendente de confirmação</p>
          <p className="text-xs text-amber-700 mt-1">
            Valor: <span className="font-semibold">{valor}</span>
            {comprovanteUrl && (
              <>
                {" · "}
                <a
                  href={comprovanteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold hover:text-amber-900"
                >
                  Ver comprovativo →
                </a>
              </>
            )}
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Ao confirmar: stock reservado é convertido em venda, fatura emitida e email enviado ao cliente.
          </p>
        </div>
        <button
          onClick={confirmar}
          disabled={isPending}
          className="flex-shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {isPending && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {isPending ? "A confirmar…" : "Confirmar pagamento"}
        </button>
      </div>
    </div>
  );
}
