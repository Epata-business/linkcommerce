import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { temPermissao } from "@/lib/rbac";
import { anularFatura } from "@/lib/faturas";
import { revalidatePath } from "next/cache";
import Link from "next/link";

const ESTADO_CONFIG: Record<string, { label: string; cls: string }> = {
  RASCUNHO: { label: "Rascunho",  cls: "bg-slate-100 text-slate-500" },
  EMITIDA:  { label: "Emitida",   cls: "bg-blue-100 text-blue-700"   },
  PAGA:     { label: "Paga",      cls: "bg-green-100 text-green-700" },
  ANULADA:  { label: "Anulada",   cls: "bg-red-100 text-red-500"     },
};

export default async function FaturasPage({
  searchParams,
}: {
  searchParams: { estado?: string; pagina?: string };
}) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!temPermissao(role, "faturas")) redirect("/dashboard");

  const lojaId = await getLojaId();
  const pagina = Math.max(1, parseInt(searchParams.pagina ?? "1", 10));
  const porPagina = 25;

  const onde = {
    lojaId,
    ...(searchParams.estado ? { estado: searchParams.estado as "RASCUNHO" | "EMITIDA" | "PAGA" | "ANULADA" } : {}),
  };

  const [total, faturas, loja] = await Promise.all([
    prisma.fatura.count({ where: onde }),
    prisma.fatura.findMany({
      where: onde,
      include: { pedido: { select: { id: true, clienteNome: true, clienteEmail: true } } },
      orderBy: { dataEmissao: "desc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.loja.findUnique({ where: { id: lojaId }, select: { moeda: true } }),
  ]);

  const moeda = loja?.moeda ?? "EUR";
  const totalPaginas = Math.ceil(total / porPagina);

  async function acaoAnular(faturaId: string) {
    "use server";
    const lid = await getLojaId();
    await anularFatura(faturaId, lid);
    revalidatePath("/dashboard/faturas");
  }

  const totalEmitidas = await prisma.fatura.aggregate({
    where: { lojaId, estado: { in: ["EMITIDA", "PAGA"] } },
    _sum: { total: true },
    _count: true,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Faturas</h1>
            <p className="text-slate-400 text-sm mt-1">{total} fatura{total !== 1 ? "s" : ""}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total faturado</p>
            <p className="text-xl font-black text-slate-900 tabular-nums">
              {Number(totalEmitidas._sum.total ?? 0).toLocaleString("pt-PT", { style: "currency", currency: moeda })}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap mb-6">
          {[undefined, "EMITIDA", "PAGA", "ANULADA"].map(e => (
            <a
              key={e ?? "todas"}
              href={e ? `/dashboard/faturas?estado=${e}` : "/dashboard/faturas"}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                searchParams.estado === e || (!searchParams.estado && !e)
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {e ? ESTADO_CONFIG[e].label : "Todas"}
            </a>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {faturas.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Nenhuma fatura ainda.{" "}
              <span className="block text-xs mt-1 text-slate-300">As faturas são criadas automaticamente quando um pagamento é confirmado.</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Número</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {faturas.map(f => {
                  const estado = ESTADO_CONFIG[f.estado] ?? ESTADO_CONFIG.EMITIDA;
                  return (
                    <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 rounded px-2 py-0.5">
                          {f.numero}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 truncate max-w-[160px]">
                          {f.clienteNome ?? f.pedido?.clienteNome ?? "—"}
                        </p>
                        <p className="text-xs text-slate-400 truncate max-w-[160px]">
                          {f.clienteEmail ?? f.pedido?.clienteEmail}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs tabular-nums">
                        {f.dataEmissao.toLocaleDateString("pt-PT")}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800 tabular-nums">
                        {Number(f.total).toLocaleString("pt-PT", { style: "currency", currency: f.moeda })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${estado.cls}`}>
                          {estado.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {f.pedidoId && (
                            <Link
                              href={`/api/fatura/${f.pedidoId}`}
                              target="_blank"
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                            >
                              Ver PDF
                            </Link>
                          )}
                          {f.estado !== "ANULADA" && (
                            <form action={acaoAnular.bind(null, f.id)}>
                              <button type="submit" className="text-xs text-slate-300 hover:text-red-500 transition-colors">
                                Anular
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalPaginas > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>Página {pagina} de {totalPaginas}</span>
            <div className="flex gap-2">
              {pagina > 1 && (
                <a href={`/dashboard/faturas?${searchParams.estado ? `estado=${searchParams.estado}&` : ""}pagina=${pagina - 1}`}
                  className="rounded-lg border border-slate-200 px-3 py-1 hover:bg-white transition-colors">
                  ← Anterior
                </a>
              )}
              {pagina < totalPaginas && (
                <a href={`/dashboard/faturas?${searchParams.estado ? `estado=${searchParams.estado}&` : ""}pagina=${pagina + 1}`}
                  className="rounded-lg border border-slate-200 px-3 py-1 hover:bg-white transition-colors">
                  Próxima →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
