import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BillingCards } from "@/app/(dashboard)/dashboard/configuracoes/planos/billing-cards";
import Link from "next/link";

export default async function SubscreverPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const lojaId = (session.user as { lojaId?: string }).lojaId;
  if (!lojaId) redirect("/onboarding");

  const [planos, loja] = await Promise.all([
    prisma.plano.findMany({ orderBy: { ordem: "asc" } }),
    prisma.loja.findUnique({
      where: { id: lojaId },
      include: { subscricao: { include: { plano: true } } },
    }),
  ]);

  // Se já tem subscrição activa, ir para o dashboard
  if (loja?.subscricao?.status === "ATIVA") redirect("/dashboard");

  const planoAtualId = loja?.subscricao?.planoId ?? loja?.planoId ?? null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center px-4 py-12">
      <Link href="/" className="text-xl font-bold text-slate-900 mb-10">
        Link<span className="text-indigo-600">Commerce</span>
      </Link>

      <div className="w-full max-w-5xl">
        <div className="mt-4 mb-8 text-center">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Acesso bloqueado</p>
          <h1 className="text-2xl font-bold text-slate-900">Escolha um plano para continuar</h1>
          <p className="text-slate-500 mt-1">Para aceder ao dashboard precisa de ter uma subscrição activa.</p>
        </div>

        <BillingCards
          isOnboarding={false}
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
          temSubscricaoStripe={!!loja?.subscricao?.stripeSubscriptionId}
          statusSubscricao={loja?.subscricao?.status ?? null}
          proximaCobranca={loja?.subscricao?.proximaCobranca?.toISOString() ?? null}
          moedaLoja={loja?.moeda ?? "EUR"}
          dadosBancarios={{
            titular: process.env.BANCO_TITULAR ?? "",
            nba: process.env.BANCO_NBA ?? "",
            iban: process.env.BANCO_IBAN ?? "",
            bic: process.env.BANCO_BIC ?? "",
            banco: "Banco Económico SA",
          }}
        />
      </div>
    </div>
  );
}
