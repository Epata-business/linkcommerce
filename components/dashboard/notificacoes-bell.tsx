"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Notificacao = {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  link: string | null;
  criadaEm: Date;
};

const TIPO_ICON: Record<string, string> = {
  novo_pedido:          "📦",
  pagamento_confirmado: "✅",
  pagamento_falhado:    "❌",
  stock_baixo:          "⚠️",
  stock_esgotado:       "🔴",
};

export function NotificacoesBell({
  naoLidas,
  recentes,
}: {
  naoLidas: number;
  recentes: Notificacao[];
}) {
  const [aberto, setAberto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function marcarTodasLidas() {
    startTransition(async () => {
      await fetch("/api/notificacoes", { method: "PATCH" });
      router.refresh();
      setAberto(false);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setAberto(!aberto)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        aria-label="Notificações"
      >
        🔔
        {naoLidas > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />

          {/* Dropdown */}
          <div className="absolute left-full ml-2 top-0 z-50 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-800">
                Notificações
                {naoLidas > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.5">
                    {naoLidas}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                {naoLidas > 0 && (
                  <button
                    onClick={marcarTodasLidas}
                    disabled={isPending}
                    className="text-[11px] text-blue-500 hover:text-blue-700 font-medium disabled:opacity-50"
                  >
                    Marcar todas lidas
                  </button>
                )}
                <Link href="/dashboard/notificacoes" onClick={() => setAberto(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-600">
                  Ver todas →
                </Link>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {recentes.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-2xl mb-2">🔔</p>
                  <p className="text-sm text-slate-400">Sem notificações</p>
                </div>
              ) : (
                recentes.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? "/dashboard/notificacoes"}
                    onClick={() => setAberto(false)}
                    className={`flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${!n.lida ? "bg-blue-50/50" : ""}`}
                  >
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {TIPO_ICON[n.tipo] ?? "🔔"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold text-slate-800 ${!n.lida ? "font-bold" : ""}`}>
                        {n.titulo}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{n.mensagem}</p>
                      <p className="text-[10px] text-slate-300 mt-0.5">
                        {new Date(n.criadaEm).toLocaleDateString("pt-PT", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!n.lida && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
