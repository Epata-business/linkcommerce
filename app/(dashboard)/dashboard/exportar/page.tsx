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
    <div className="min-h-screen" style={{ background: "#F7F8FC" }}>
      <div className="max-w-3xl mx-auto px-5 py-7">
        <div className="mb-6">
          <h1 className="heading-lg">Exportar dados</h1>
          <p className="body-sm mt-0.5">
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
