import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { BackButton } from "@/components/ui/back-button";
import { RedesSociaisClient } from "./redes-sociais-client";

export const metadata = { title: "Redes Sociais — LinkCommerce" };

export default async function RedesSociaisPage() {
  const lojaId = await getLojaId();

  const [contas, publicacoes] = await Promise.all([
    prisma.contaSocial.findMany({
      where: { lojaId, ativa: true },
      orderBy: { criadaEm: "asc" },
      select: {
        id: true,
        plataforma: true,
        nomeExibido: true,
        accountId: true,
        criadaEm: true,
      },
    }),
    prisma.publicacaoSocial.findMany({
      where: { lojaId },
      orderBy: { criadoEm: "desc" },
      take: 30,
      select: {
        id: true,
        conteudo: true,
        plataformas: true,
        estado: true,
        agendadoPara: true,
        publicadoEm: true,
        criadoEm: true,
      },
    }),
  ]);

  return (
    <div className="min-h-screen" style={{ background: "#F7F8FC" }}>
    <div className="max-w-4xl mx-auto px-5 py-7">
      <BackButton href="/dashboard/marketing" label="← Marketing" />
      <div className="mb-6">
        <h1 className="heading-lg">Redes Sociais</h1>
        <p className="body-sm mt-0.5">
          Publique os seus produtos directamente nas redes sociais a partir do painel.
        </p>
      </div>
      <RedesSociaisClient
        contasIniciais={contas.map((c) => ({
          ...c,
          criadaEm: c.criadaEm.toISOString(),
        }))}
        publicacoesIniciais={publicacoes.map((p) => ({
          ...p,
          agendadoPara: p.agendadoPara?.toISOString() ?? null,
          publicadoEm: p.publicadoEm?.toISOString() ?? null,
          criadoEm: p.criadoEm.toISOString(),
        }))}
      />
    </div>
    </div>
  );
}
