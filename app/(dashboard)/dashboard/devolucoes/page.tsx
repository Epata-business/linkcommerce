import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { temPermissao } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { registarAudit } from "@/lib/audit";
import { registarDevolucao } from "@/lib/inventario";
import { formatarPreco } from "@/lib/moeda";
import Link from "next/link";

export default async function DevolucoesPage({
  searchParams,
}: {
  searchParams: { pagina?: string };
}) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!temPermissao(role, "pedidos")) redirect("/dashboard");

  const lojaId = await getLojaId();
  const pagina = Math.max(1, parseInt(searchParams.pagina ?? "1", 10));
  const porPagina = 20;

  const [loja, total, pedidosDevolvidos, pedidosEntregues] = await Promise.all([
    prisma.loja.findUnique({ where: { id: lojaId }, select: { moeda: true } }),
    prisma.pedido.count({ where: { lojaId, status: "RETURNED" } }),
    prisma.pedido.findMany({
      where: { lojaId, status: "RETURNED" },
      orderBy: { updatedAt: "desc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      include: { itens: { include: { produto: { select: { titulo: true } }, variante: { select: { nomeOpcao: true } } } } },
    }),
    prisma.pedido.findMany({
      where: { lojaId, status: "DELIVERED" },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, clienteNome: true, clienteEmail: true, total: true, createdAt: true },
    }),
  ]);

  const moeda = loja?.moeda ?? "EUR";
  const totalPaginas = Math.ceil(total / porPagina);

  async function registarDevolucaoAction(formData: FormData) {
    "use server";
    const lid = await getLojaId();
    const s = await auth();
    const pedidoId = formData.get("pedidoId") as string;
    const nota = (formData.get("nota") as string) || "Devolução registada pelo lojista";
    if (!pedidoId) return;

    const pedido = await prisma.pedido.findFirst({
      where: { id: pedidoId, lojaId: lid, status: "DELIVERED" },
      include: { itens: true },
    });
    if (!pedido) return;

    const itens = pedido.itens.map(i => ({
      produtoId: i.produtoId,
      varianteId: i.varianteId ?? null,
      quantidade: i.quantidade,
    }));

    await prisma.$transaction(async (tx) => {
      await tx.pedido.update({ where: { id: pedidoId }, data: { status: "RETURNED" } });
      await registarDevolucao(tx, lid, pedidoId, itens, nota);
    });

    void registarAudit({
      lojaId: lid,
      userId: (s?.user as { id?: string })?.id,
      userEmail: s?.user?.email ?? undefined,
      acao: "ATUALIZAR",
      entidade: "Pedido",
      entidadeId: pedidoId,
      valoresNovos: { status: "RETURNED", nota },
    });

    revalidatePath("/dashboard/devolucoes");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        <div>
          <h1 className="text-2xl font-black text-slate-900">Devoluções</h1>
          <p className="text-slate-400 text-sm mt-1">Registar devoluções e repor stock automaticamente</p>
        </div>

        {/* Registar nova devolução */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-800 mb-4">Registar devolução</h2>
          {pedidosEntregues.length === 0 ? (
            <p className="text-sm text-slate-400">Não há pedidos entregues elegíveis para devolução.</p>
          ) : (
            <form action={registarDevolucaoAction} className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Pedido entregue</label>
                <select
                  name="pedidoId"
                  required
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">— Selecionar pedido —</option>
                  {pedidosEntregues.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.id.slice(-8).toUpperCase()} · {p.clienteNome ?? p.clienteEmail} · {formatarPreco(Number(p.total), moeda)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Motivo (opcional)</label>
                <input
                  name="nota"
                  type="text"
                  placeholder="Ex: produto com defeito"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl px-4 py-2 text-sm font-bold bg-slate-900 text-white hover:bg-slate-700 transition-colors"
              >
                Registar devolução
              </button>
            </form>
          )}
        </div>

        {/* Lista de devoluções */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Histórico de devoluções</h2>
            <span className="text-xs text-slate-400">{total} devoluç{total !== 1 ? "ões" : "ão"}</span>
          </div>

          {pedidosDevolvidos.length === 0 ? (
            <div className="px-5 py-12 text-center text-slate-400 text-sm">
              Ainda não foram registadas devoluções.
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {pedidosDevolvidos.map(p => (
                <div key={p.id} className="px-5 py-4 flex flex-wrap items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link
                        href={`/dashboard/pedidos/${p.id}`}
                        className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors"
                      >
                        #{p.id.slice(-8).toUpperCase()}
                      </Link>
                      <span className="rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 uppercase">
                        Devolvido
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{p.clienteNome ?? p.clienteEmail}</p>
                    <div className="mt-2 space-y-0.5">
                      {p.itens.map(i => (
                        <p key={i.id} className="text-xs text-slate-400">
                          {i.quantidade}× {i.produto.titulo}
                          {i.variante ? ` (${i.variante.nomeOpcao})` : ""}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-700">{formatarPreco(Number(p.total), moeda)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {p.updatedAt.toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPaginas > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
              <span>Página {pagina} de {totalPaginas}</span>
              <div className="flex gap-2">
                {pagina > 1 && (
                  <a href={`/dashboard/devolucoes?pagina=${pagina - 1}`}
                    className="rounded-lg border border-slate-200 px-3 py-1 hover:bg-slate-50">← Anterior</a>
                )}
                {pagina < totalPaginas && (
                  <a href={`/dashboard/devolucoes?pagina=${pagina + 1}`}
                    className="rounded-lg border border-slate-200 px-3 py-1 hover:bg-slate-50">Próxima →</a>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
