import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { temPermissao } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { registarAudit } from "@/lib/audit";
import { ajustarStock } from "@/lib/inventario";

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: { q?: string; pagina?: string };
}) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!temPermissao(role, "produtos")) redirect("/dashboard");

  const lojaId = await getLojaId();
  const q = searchParams.q ?? "";
  const pagina = Math.max(1, parseInt(searchParams.pagina ?? "1", 10));
  const porPagina = 20;

  const onde = {
    lojaId,
    ativo: true,
    ...(q ? { titulo: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [total, produtos, movimentos] = await Promise.all([
    prisma.produto.count({ where: onde }),
    prisma.produto.findMany({
      where: onde,
      include: { variantes: true },
      orderBy: { titulo: "asc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.movimentoStock.findMany({
      where: { lojaId },
      orderBy: { criadoEm: "desc" },
      take: 30,
      include: { produto: { select: { titulo: true } } },
    }),
  ]);

  const totalPaginas = Math.ceil(total / porPagina);

  // Estatísticas globais
  const stats = await prisma.$queryRaw<{
    total_produtos: bigint;
    esgotados: bigint;
    stock_baixo: bigint;
    total_unidades: bigint;
  }[]>`
    SELECT
      COUNT(*)::bigint AS total_produtos,
      COUNT(*) FILTER (WHERE (stock - "stockReservado") <= 0)::bigint AS esgotados,
      COUNT(*) FILTER (WHERE "stockMinimo" > 0 AND (stock - "stockReservado") > 0 AND (stock - "stockReservado") <= "stockMinimo")::bigint AS stock_baixo,
      COALESCE(SUM(stock), 0)::bigint AS total_unidades
    FROM produtos
    WHERE "lojaId" = ${lojaId} AND ativo = true
  `;

  const st = stats[0];

  async function ajustar(formData: FormData) {
    "use server";
    const lid = await getLojaId();
    const s = await auth();
    const produtoId = formData.get("produtoId") as string;
    const varianteId = (formData.get("varianteId") as string) || null;
    const deltaStr = formData.get("delta") as string;
    const nota = (formData.get("nota") as string) || "Ajuste manual";
    const delta = parseInt(deltaStr, 10);
    if (!produtoId || isNaN(delta) || delta === 0) return;

    try {
      await prisma.$transaction(async (tx) => {
        await ajustarStock(tx, lid, produtoId, varianteId, delta, (s?.user as { id?: string })?.id, nota);
      });
      void registarAudit({
        lojaId: lid,
        userId: (s?.user as { id?: string })?.id,
        userEmail: s?.user?.email ?? undefined,
        acao: "ATUALIZAR",
        entidade: "Produto",
        entidadeId: produtoId,
        valoresNovos: { ajusteStock: delta, varianteId, nota },
      });
    } catch {
      // erro silencioso — toast não disponível em server action sem resposta
    }
    revalidatePath("/dashboard/inventario");
  }

  const TIPO_LABEL: Record<string, string> = {
    RESERVA: "Reserva",
    RESERVA_EXPIRADA: "Reserva expirada",
    VENDA: "Venda",
    CANCELAMENTO: "Cancelamento",
    REPOSICAO: "Reposição",
    AJUSTE: "Ajuste",
    DEVOLUCAO: "Devolução",
  };

  const TIPO_COR: Record<string, string> = {
    VENDA: "text-red-600",
    RESERVA: "text-amber-600",
    CANCELAMENTO: "text-slate-500",
    RESERVA_EXPIRADA: "text-slate-400",
    REPOSICAO: "text-green-600",
    AJUSTE: "text-blue-600",
    DEVOLUCAO: "text-teal-600",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-black text-slate-900">Inventário</h1>
          <p className="text-slate-400 text-sm mt-1">Gerir stock físico, ajustes e histórico de movimentos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total produtos", value: Number(st?.total_produtos ?? 0), cor: "text-slate-800" },
            { label: "Total unidades", value: Number(st?.total_unidades ?? 0), cor: "text-slate-800" },
            { label: "Com stock baixo", value: Number(st?.stock_baixo ?? 0), cor: "text-amber-600" },
            { label: "Esgotados", value: Number(st?.esgotados ?? 0), cor: "text-red-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs text-slate-400 font-medium">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.cor}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">

          {/* Tabela de produtos */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 gap-3 flex-wrap">
              <h2 className="font-bold text-slate-800">Produtos</h2>
              <form method="get" action="/dashboard/inventario" className="flex gap-2">
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Pesquisar…"
                  className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100 w-48"
                />
                <button type="submit" className="text-sm font-semibold bg-slate-900 text-white rounded-xl px-3 py-1.5">
                  Pesquisar
                </button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Produto / Variante</th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Físico</th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Reservado</th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Disponível</th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ajuste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {produtos.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">
                        Nenhum produto encontrado.
                      </td>
                    </tr>
                  )}
                  {produtos.map(p => {
                    const rows = p.variantes.length > 0 ? p.variantes.map(v => ({
                      id: v.id,
                      label: `${p.titulo} — ${v.nomeOpcao}`,
                      produtoId: p.id,
                      varianteId: v.id,
                      stock: v.stock,
                      stockReservado: v.stockReservado,
                      stockMinimo: 0,
                    })) : [{
                      id: p.id,
                      label: p.titulo,
                      produtoId: p.id,
                      varianteId: null as string | null,
                      stock: p.stock,
                      stockReservado: p.stockReservado,
                      stockMinimo: p.stockMinimo,
                    }];

                    return rows.map(row => {
                      const disponivel = row.stock - row.stockReservado;
                      const corDisp = disponivel <= 0
                        ? "text-red-600 font-bold"
                        : row.stockMinimo > 0 && disponivel <= row.stockMinimo
                          ? "text-amber-600 font-semibold"
                          : "text-slate-700";

                      return (
                        <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3 font-medium text-slate-800 max-w-[220px] truncate" title={row.label}>
                            {row.label}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-600 font-mono tabular-nums">{row.stock}</td>
                          <td className="px-3 py-3 text-right text-amber-600 font-mono tabular-nums">{row.stockReservado}</td>
                          <td className={`px-3 py-3 text-right font-mono tabular-nums ${corDisp}`}>{disponivel}</td>
                          <td className="px-3 py-3">
                            <form action={ajustar}>
                              <input type="hidden" name="produtoId" value={row.produtoId} />
                              {row.varianteId && <input type="hidden" name="varianteId" value={row.varianteId} />}
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  name="delta"
                                  placeholder="±"
                                  className="w-16 text-xs border border-slate-200 rounded-lg px-2 py-1 text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                                <input
                                  type="text"
                                  name="nota"
                                  placeholder="Motivo"
                                  className="w-28 text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                                <button
                                  type="submit"
                                  className="text-xs font-bold bg-slate-900 text-white rounded-lg px-2 py-1 hover:bg-slate-700 transition-colors"
                                >
                                  OK
                                </button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                <span>Página {pagina} de {totalPaginas}</span>
                <div className="flex gap-2">
                  {pagina > 1 && (
                    <a href={`/dashboard/inventario?q=${q}&pagina=${pagina - 1}`}
                      className="rounded-lg border border-slate-200 px-3 py-1 hover:bg-slate-50 transition-colors">← Anterior</a>
                  )}
                  {pagina < totalPaginas && (
                    <a href={`/dashboard/inventario?q=${q}&pagina=${pagina + 1}`}
                      className="rounded-lg border border-slate-200 px-3 py-1 hover:bg-slate-50 transition-colors">Próxima →</a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Histórico de movimentos */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Movimentos recentes</h2>
              <p className="text-xs text-slate-400 mt-0.5">Últimos 30 eventos</p>
            </div>
            <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
              {movimentos.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-400">Sem movimentos registados.</p>
              )}
              {movimentos.map(m => {
                const positivo = m.quantidade > 0;
                const corQtd = positivo ? "text-green-600" : "text-red-600";
                return (
                  <div key={m.id} className="px-5 py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{m.produto.titulo}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        <span className={`font-semibold ${TIPO_COR[m.tipo] ?? "text-slate-500"}`}>
                          {TIPO_LABEL[m.tipo] ?? m.tipo}
                        </span>
                        {m.nota ? ` — ${m.nota}` : ""}
                      </p>
                      <p className="text-[10px] text-slate-300 mt-0.5">
                        {m.criadoEm.toLocaleDateString("pt-PT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className={`text-sm font-black tabular-nums font-mono ${corQtd}`}>
                      {positivo ? "+" : ""}{m.quantidade}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
