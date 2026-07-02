import { prisma } from "@/lib/prisma";
import { formatarPreco } from "@/lib/moeda";
import { BackButton } from "@/components/ui/back-button";
import { RemoverLojaBtn, TogglePublicadaBtn } from "./loja-actions-btn";

export default async function AdminLojasPage() {
  const lojas = await prisma.loja.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      utilizadores: { select: { name: true, email: true }, take: 1 },
      subscricao: { include: { plano: { select: { nome: true } } } },
      plano: { select: { nome: true } },
      _count: { select: { pedidos: true, produtos: true, clientes: true } },
    },
  });

  const receitasPorLoja = await prisma.pedido.groupBy({
    by: ["lojaId"],
    _sum: { total: true },
  });
  const receitaMap = Object.fromEntries(receitasPorLoja.map((r) => [r.lojaId, Number(r._sum.total ?? 0)]));

  return (
    <div className="p-6">
      <BackButton href="/admin" label="← Painel admin" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Todas as lojas</h1>
        <p className="text-sm text-slate-500">{lojas.length} loja{lojas.length !== 1 ? "s" : ""} registada{lojas.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Loja</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Dono</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Plano</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-center">Produtos</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-center">Pedidos</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Receita</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Criada</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lojas.map((loja) => (
                <tr key={loja.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: loja.corPrimaria || "#153DFC" }}>
                        {loja.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{loja.nome}</p>
                        <p className="text-xs text-slate-400">{loja.subdominio}.linkcommerce.app</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{loja.utilizadores[0]?.name ?? "—"}</p>
                    <p className="text-xs text-slate-400">{loja.utilizadores[0]?.email ?? ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 text-xs font-medium">
                      {loja.subscricao?.plano?.nome ?? loja.plano?.nome ?? "Free"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">{loja._count.produtos}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{loja._count.pedidos}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {formatarPreco(receitaMap[loja.id] ?? 0, loja.moeda ?? "EUR")}
                  </td>
                  <td className="px-4 py-3">
                    <TogglePublicadaBtn lojaId={loja.id} publicada={loja.publicada} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(loja.createdAt).toLocaleDateString("pt-PT")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a href={`/api/admin/impersonate?lojaId=${loja.id}`}
                        className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors">
                        Aceder →
                      </a>
                      <RemoverLojaBtn lojaId={loja.id} nomeLoja={loja.nome} />
                    </div>
                  </td>
                </tr>
              ))}
              {lojas.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-slate-400">Nenhuma loja ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
