import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { notFound } from "next/navigation";
import { ZonasEntregaManager } from "@/components/dashboard/zonas-entrega-manager";

export default async function EnviosPage() {
  const lojaId = await getLojaId();
  if (!lojaId) notFound();

  const loja = await prisma.loja.findUnique({
    where: { id: lojaId },
    select: { moeda: true },
  });

  const zonasRaw = await prisma.zonaEntrega.findMany({
    where: { lojaId },
    orderBy: { ordem: "asc" },
  });
  const zonas = zonasRaw.map(z => ({ ...z, preco: Number(z.preco) }));

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Zonas de Entrega</h1>
        <p className="text-sm text-slate-500 mt-1">
          Define as zonas onde entregas e o preço correspondente. Os clientes escolhem a zona no checkout.
        </p>
      </div>
      <ZonasEntregaManager zonas={zonas} moeda={loja?.moeda ?? "AOA"} />
    </div>
  );
}
