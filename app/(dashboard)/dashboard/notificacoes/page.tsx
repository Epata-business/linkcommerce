import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import Link from "next/link";
import { MarcarTodasLidasButton } from "@/components/dashboard/marcar-notificacoes-lidas";

const TIPO_CONFIG: Record<string, { icon: string; cor: string }> = {
  novo_pedido:          { icon: "📦", cor: "text-blue-600" },
  pagamento_confirmado: { icon: "✅", cor: "text-green-600" },
  pagamento_falhado:    { icon: "❌", cor: "text-red-600" },
  stock_baixo:          { icon: "⚠️", cor: "text-amber-600" },
  stock_esgotado:       { icon: "🔴", cor: "text-red-700" },
};

export default async function NotificacoesPage() {
  const lojaId = await getLojaId();

  const [notificacoes, naoLidas] = await Promise.all([
    prisma.notificacao.findMany({
      where: { lojaId },
      orderBy: { criadaEm: "desc" },
      take: 100,
    }),
    prisma.notificacao.count({ where: { lojaId, lida: false } }),
  ]);

  // Marcar todas como lidas automaticamente ao abrir a página
  if (naoLidas > 0) {
    await prisma.notificacao.updateMany({
      where: { lojaId, lida: false },
      data: { lida: true },
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Notificações</h1>
            <p className="text-slate-400 text-sm mt-1">
              {notificacoes.length} notificaç{notificacoes.length !== 1 ? "ões" : "ão"} no total
            </p>
          </div>
          {naoLidas > 0 && <MarcarTodasLidasButton />}
        </div>

        {notificacoes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-24 text-center">
            <div className="text-5xl mb-4">🔔</div>
            <p className="font-bold text-slate-700">Sem notificações</p>
            <p className="text-sm text-slate-400 mt-1">As notificações de pedidos, pagamentos e stock aparecem aqui.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notificacoes.map((n) => {
              const cfg = TIPO_CONFIG[n.tipo] ?? { icon: "🔔", cor: "text-slate-600" };
              return (
                <div key={n.id}
                  className={`flex gap-4 bg-white rounded-2xl border p-4 transition-all
                    ${n.lida ? "border-slate-100" : "border-blue-100 bg-blue-50/30"}`}>
                  <span className="text-2xl flex-shrink-0 mt-0.5">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-slate-800 ${!n.lida ? "font-bold" : ""}`}>
                      {n.titulo}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">{n.mensagem}</p>
                    <p className="text-xs text-slate-300 mt-1">
                      {new Date(n.criadaEm).toLocaleDateString("pt-PT", {
                        weekday: "short", day: "numeric", month: "short",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {n.link && (
                    <Link href={n.link}
                      className="flex-shrink-0 self-center text-xs font-semibold text-blue-500 hover:text-blue-700 whitespace-nowrap">
                      Ver →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
