import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { ExportarClient } from "./exportar-client";

export default async function ExportarPage() {
  const lojaId = await getLojaId();

  const [totalPedidos, totalClientes, totalProdutos] = await Promise.all([
    prisma.pedido.count({ where: { lojaId } }),
    prisma.pedido.groupBy({ by: ["clienteEmail"], where: { lojaId } }).then(r => r.length),
    prisma.produto.count({ where: { lojaId } }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900">Exportar dados</h1>
          <p className="text-slate-400 text-sm mt-1">
            Descarregue os seus dados em formato CSV compatível com Excel e Google Sheets.
          </p>
        </div>

        <ExportarClient
          totalPedidos={totalPedidos}
          totalClientes={totalClientes}
          totalProdutos={totalProdutos}
        />
      </div>
    </div>
  );
}
