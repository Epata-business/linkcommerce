import { prisma } from "@/lib/prisma";
import { SubscricoesAdmin } from "./subscricoes-admin";

export default async function SubscricoesPage() {
  const pendentes = await prisma.subscricao.findMany({
    where: { status: "PENDENTE_TRANSFERENCIA" },
    include: {
      loja: { select: { nome: true, subdominio: true, moeda: true } },
      plano: { select: { nome: true, precoMensal: true } },
    },
    orderBy: { updatedAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Subscrições AOA — Pendentes</h1>
      <p className="text-slate-500 mb-8">Transferências bancárias aguardando confirmação ({pendentes.length})</p>

      {pendentes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400">
          Nenhuma transferência pendente.
        </div>
      ) : (
        <SubscricoesAdmin
          pendentes={pendentes.map((s) => ({
            id: s.id,
            loja: s.loja.nome,
            subdominio: s.loja.subdominio,
            plano: s.plano.nome,
            precoMensal: Number(s.plano.precoMensal),
            comprovanteUrl: s.comprovanteUrl ?? "",
            atualizadoEm: s.updatedAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
