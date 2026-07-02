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
    <div className="p-6">
      <BackButton href="/dashboard" label="← Dashboard" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            {produtos.length} produto{produtos.length === 1 ? "" : "s"} na sua loja
          </p>
        </div>
        <ProdutoFormDialog trigger={<Button>+ Novo produto</Button>} />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Produto</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Preço</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Variantes</th>
              <th className="p-3 text-right">Acções</th>
            </tr>
          </thead>
          <tbody>
            {produtos.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Ainda não tem produtos. Crie o primeiro acima.
                </td>
              </tr>
            )}
            {produtos.map((produto) => (
              <tr key={produto.id} className="border-t">
                <td className="p-3 font-medium">{produto.titulo}</td>
                <td className="p-3 text-muted-foreground">{produto.sku ?? "—"}</td>
                <td className="p-3 font-medium">{formatarPreco(Number(produto.preco), moeda)}</td>
                <td className="p-3">
                  <span className={produto.stock <= 0 ? "text-red-600 font-medium" : ""}>
                    {produto.stock}
                  </span>
                </td>
                <td className="p-3">{produto.variantes.length}</td>
                <td className="p-3 text-right">
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
