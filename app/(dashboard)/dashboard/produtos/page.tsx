import { prisma } from "@/lib/prisma";
import { formatarPreco } from "@/lib/moeda";
import { getLojaId } from "@/lib/get-loja-id";
import { Button } from "@/components/ui/button";
import { ProdutoFormDialog } from "@/components/dashboard/produto-form-dialog";
import { ProdutoRowActions } from "@/components/dashboard/produto-row-actions";
import { BackButton } from "@/components/ui/back-button";

export default async function ProdutosPage() {
  const lojaId = await getLojaId();

  const [loja, produtos] = await Promise.all([
    prisma.loja.findUnique({ where: { id: lojaId }, select: { moeda: true } }),
    prisma.produto.findMany({
      where: { lojaId },
      include: { variantes: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const moeda = loja?.moeda ?? "EUR";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <BackButton href="/dashboard" label="← Dashboard" />

      <div className="flex items-center justify-between mt-4 mb-6">
        <div>
          <h1 className="heading-lg">Produtos</h1>
          <p className="body-sm mt-0.5">
            {produtos.length} produto{produtos.length === 1 ? "" : "s"} na sua loja
          </p>
        </div>
        <ProdutoFormDialog trigger={<Button>+ Novo produto</Button>} moeda={moeda} />
      </div>

      <div className="bg-white rounded-2xl overflow-hidden overflow-x-auto" style={{ border: "1px solid hsl(220 20% 91%)", boxShadow: "0 1px 3px rgba(15,17,23,0.04)" }}>
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="table-header" style={{ borderBottom: "1px solid hsl(220 20% 91%)" }}>
              <th className="px-5 py-3.5 text-left font-semibold text-[#9CA3AF] text-xs uppercase tracking-wide">Produto</th>
              <th className="px-4 py-3.5 text-left font-semibold text-[#9CA3AF] text-xs uppercase tracking-wide">SKU</th>
              <th className="px-4 py-3.5 text-left font-semibold text-[#9CA3AF] text-xs uppercase tracking-wide">Preço</th>
              <th className="px-4 py-3.5 text-left font-semibold text-[#9CA3AF] text-xs uppercase tracking-wide">Stock</th>
              <th className="px-4 py-3.5 text-left font-semibold text-[#9CA3AF] text-xs uppercase tracking-wide">Variantes</th>
              <th className="px-5 py-3.5 text-right font-semibold text-[#9CA3AF] text-xs uppercase tracking-wide">Acções</th>
            </tr>
          </thead>
          <tbody>
            {produtos.length === 0 && (
              <tr>
                <td colSpan={6} className="py-14 text-center text-sm text-[#9CA3AF]">
                  Ainda não tem produtos. Crie o primeiro acima.
                </td>
              </tr>
            )}
            {produtos.map((produto) => (
              <tr key={produto.id} className="transition-colors hover:bg-[#F7F8FC]" style={{ borderTop: "1px solid hsl(220 20% 95%)" }}>
                <td className="px-5 py-3.5 font-semibold text-[#0F1117]">{produto.titulo}</td>
                <td className="px-4 py-3.5 text-[#9CA3AF] font-mono text-xs">{produto.sku ?? "—"}</td>
                <td className="px-4 py-3.5 font-semibold text-[#0F1117] tabular-nums">{formatarPreco(Number(produto.preco), moeda)}</td>
                <td className="px-4 py-3.5">
                  {(() => {
                    const disponivel = produto.stock - produto.stockReservado;
                    const cls = disponivel <= 0
                      ? "text-red-600 font-semibold"
                      : disponivel <= produto.stockMinimo && produto.stockMinimo > 0
                        ? "text-amber-600 font-semibold"
                        : "text-[#0F1117]";
                    return (
                      <span className={cls} title={`Físico: ${produto.stock} | Reservado: ${produto.stockReservado}`}>
                        {disponivel}
                        {produto.stockReservado > 0 && (
                          <span className="ml-1 text-[10px] text-[#9CA3AF]">({produto.stockReservado} res.)</span>
                        )}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-4 py-3.5">
                  {produto.variantes.length > 0 ? (
                    <span className="badge badge-blue">{produto.variantes.length} var.</span>
                  ) : (
                    <span className="text-[#9CA3AF]">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <ProdutoRowActions
                    produto={{
                      id: produto.id,
                      titulo: produto.titulo,
                      descricao: produto.descricao ?? "",
                      preco: Number(produto.preco),
                      sku: produto.sku ?? "",
                      stock: produto.stock,
                      imagemUrl: produto.imagemUrl ?? "",
                    }}
                    moeda={moeda}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
