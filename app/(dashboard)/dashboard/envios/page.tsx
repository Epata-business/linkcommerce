import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { temPermissao } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { ZonasEntregaManager } from "@/components/dashboard/zonas-entrega-manager";
import { EnviosExpedirClient } from "./envios-expedir-client";
import { atualizarStatusPedido } from "../pedidos/actions";

export default async function EnviosPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!temPermissao(role, "envios")) redirect("/dashboard");

  const lojaId = await getLojaId();

  const [loja, pedidosProcessing, pedidosShipped, zonas] = await Promise.all([
    prisma.loja.findUnique({
      where: { id: lojaId },
      select: { moeda: true, corPrimaria: true },
    }),

    // Pedidos por expedir (pagos, a aguardar envio)
    prisma.pedido.findMany({
      where: { lojaId, status: "PROCESSING" },
      select: {
        id: true,
        clienteNome: true,
        clienteEmail: true,
        morada: true,
        total: true,
        createdAt: true,
        zonaEntrega: { select: { nome: true } },
        itens: { select: { quantidade: true, produto: { select: { titulo: true } } }, take: 3 },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),

    // Últimos enviados (últimos 30 dias)
    prisma.pedido.findMany({
      where: {
        lojaId,
        status: "SHIPPED",
        updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: {
        id: true,
        clienteNome: true,
        clienteEmail: true,
        codigoRastreio: true,
        transportadora: true,
        total: true,
        updatedAt: true,
        zonaEntrega: { select: { nome: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),

    prisma.zonaEntrega.findMany({
      where: { lojaId },
      orderBy: { ordem: "asc" },
    }),
  ]);

  const moeda = loja?.moeda ?? "AOA";
  const cor = loja?.corPrimaria ?? "#153DFC";

  async function registarEnvio(pedidoId: string, codigoRastreio: string, transportadora: string) {
    "use server";
    await atualizarStatusPedido(pedidoId, "SHIPPED", codigoRastreio || undefined, transportadora || undefined);
    revalidatePath("/dashboard/envios");
  }

  const pedidosProcessingSerial = pedidosProcessing.map(p => ({
    id: p.id,
    clienteNome: p.clienteNome,
    clienteEmail: p.clienteEmail,
    morada: p.morada as Record<string, string> | null,
    total: Number(p.total),
    createdAt: p.createdAt.toISOString(),
    zonaEntregaNome: p.zonaEntrega?.nome ?? null,
    itens: p.itens.map(i => ({ titulo: i.produto?.titulo ?? "Produto", quantidade: i.quantidade })),
  }));

  const pedidosShippedSerial = pedidosShipped.map(p => ({
    id: p.id,
    clienteNome: p.clienteNome,
    clienteEmail: p.clienteEmail,
    codigoRastreio: p.codigoRastreio,
    transportadora: p.transportadora,
    total: Number(p.total),
    updatedAt: p.updatedAt.toISOString(),
    zonaEntregaNome: p.zonaEntrega?.nome ?? null,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Envios</h1>
          <p className="text-slate-400 text-sm mt-1">
            {pedidosProcessing.length} pedido{pedidosProcessing.length !== 1 ? "s" : ""} por expedir
          </p>
        </div>

        <EnviosExpedirClient
          pedidosProcessing={pedidosProcessingSerial}
          pedidosShipped={pedidosShippedSerial}
          moeda={moeda}
          cor={cor}
          registarEnvio={registarEnvio}
        />

        {/* Zonas de entrega */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Zonas de Entrega</h2>
          <ZonasEntregaManager zonas={zonas.map(z => ({ ...z, preco: Number(z.preco) }))} moeda={moeda} />
        </div>
      </div>
    </div>
  );
}
