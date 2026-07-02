import { prisma } from "@/lib/prisma";
import { BackButton } from "@/components/ui/back-button";
import { getLojaId } from "@/lib/get-loja-id";
import { BillingCards } from "./billing-cards";

export default async function PlanosPage({
  searchParams,
}: {
  searchParams: { sucesso?: string };
}) {
  const lojaId = await getLojaId();

  const [planos, loja] = await Promise.all([
    prisma.plano.findMany({ orderBy: { ordem: "asc" } }),
    prisma.loja.findUnique({
      where: { id: lojaId },
      include: { subscricao: { include: { plano: true } } },
    }),
  ]);

  const planoAtualId = loja?.subscricao?.planoId ?? loja?.planoId ?? null;
  const subscricao = loja?.subscricao;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <BackButton href="/dashboard/configuracoes" label="← Configurações" />

      <div className="mt-4 mb-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Planos LinkCommerce</h1>
        <p className="text-slate-500 mt-1">Escolha o plano que melhor se adapta ao seu negócio.</p>
      </div>

      {searchParams.sucesso === "1" && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
          <p className="text-green-800 font-bold text-lg">🎉 Subscrição activada com sucesso!</p>
          <p className="text-green-600 text-sm mt-1">O seu plano foi actualizado. Pode gerir a subscrição abaixo.</p>
        </div>
      )}

      {subscricao?.status === "EM_FALTA" && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
          <p className="text-red-800 font-bold">⚠️ Pagamento em falta</p>
          <p className="text-red-600 text-sm mt-1">Actualize o seu método de pagamento para evitar a interrupção do serviço.</p>
        </div>
      )}

      <BillingCards
        planos={planos.map(p => ({
          id: p.id,
          nome: p.nome,
          slug: p.slug,
          precoMensal: Number(p.precoMensal),
          comissaoPercentual: Number(p.comissaoPercentual),
          limiteProdutos: p.limiteProdutos,
          permiteDominioProprio: p.permiteDominioProprio,
          permiteApiAccess: p.permiteApiAccess,
          permiteWhiteLabel: p.permiteWhiteLabel,
          stripePriceId: p.stripePriceId,
          ordem: p.ordem,
        }))}
        planoAtualId={planoAtualId}
        temSubscricaoStripe={!!subscricao?.stripeSubscriptionId}
        statusSubscricao={subscricao?.status ?? null}
        proximaCobranca={subscricao?.proximaCobranca?.toISOString() ?? null}
      />
    </div>
  );
}
