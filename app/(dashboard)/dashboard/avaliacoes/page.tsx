import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { temPermissao } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { registarAudit } from "@/lib/audit";

export default async function AvaliacoesPage({
  searchParams,
}: {
  searchParams: { filtro?: string; pagina?: string };
}) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!temPermissao(role, "produtos")) redirect("/dashboard");

  const lojaId = await getLojaId();
  const filtro = searchParams.filtro ?? "pendentes";
  const pagina = Math.max(1, parseInt(searchParams.pagina ?? "1", 10));
  const porPagina = 20;

  const onde = {
    lojaId,
    ...(filtro === "pendentes" ? { aprovada: false } : filtro === "aprovadas" ? { aprovada: true } : {}),
  };

  const [total, avaliacoes] = await Promise.all([
    prisma.avaliacao.count({ where: onde }),
    prisma.avaliacao.findMany({
      where: onde,
      include: { produto: { select: { titulo: true } } },
      orderBy: { criadaEm: "desc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
  ]);

  const pendentesCount = await prisma.avaliacao.count({ where: { lojaId, aprovada: false } });
  const totalPaginas = Math.ceil(total / porPagina);

  async function aprovar(id: string) {
    "use server";
    const lid = await getLojaId();
    const s = await auth();
    await prisma.avaliacao.updateMany({ where: { id, lojaId: lid }, data: { aprovada: true } });
    void registarAudit({
      lojaId: lid,
      userId: (s?.user as { id?: string })?.id,
      userEmail: s?.user?.email ?? undefined,
      acao: "ATUALIZAR",
      entidade: "Avaliacao",
      entidadeId: id,
      valoresNovos: { aprovada: true },
    });
    revalidatePath("/dashboard/avaliacoes");
  }

  async function rejeitar(id: string) {
    "use server";
    const lid = await getLojaId();
    const s = await auth();
    const av = await prisma.avaliacao.findFirst({ where: { id, lojaId: lid }, select: { estrelas: true, clienteEmail: true } });
    await prisma.avaliacao.delete({ where: { id } });
    void registarAudit({
      lojaId: lid,
      userId: (s?.user as { id?: string })?.id,
      userEmail: s?.user?.email ?? undefined,
      acao: "REMOVER",
      entidade: "Avaliacao",
      entidadeId: id,
      valoresAntigos: { estrelas: av?.estrelas, clienteEmail: av?.clienteEmail },
    });
    revalidatePath("/dashboard/avaliacoes");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Avaliações</h1>
            <p className="text-slate-400 text-sm mt-1">
              {pendentesCount > 0
                ? `${pendentesCount} avaliação${pendentesCount !== 1 ? "ões" : ""} a aguardar moderação`
                : "Todas as avaliações moderadas"}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "pendentes", label: `Pendentes${pendentesCount > 0 ? ` (${pendentesCount})` : ""}` },
            { key: "aprovadas", label: "Aprovadas" },
            { key: "todas", label: "Todas" },
          ].map(f => (
            <a key={f.key} href={`/dashboard/avaliacoes?filtro=${f.key}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                filtro === f.key
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}>
              {f.label}
            </a>
          ))}
        </div>

        <div className="space-y-4">
          {avaliacoes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center text-slate-400 text-sm">
              Nenhuma avaliação {filtro === "pendentes" ? "pendente" : filtro === "aprovadas" ? "aprovada" : ""}.
            </div>
          ) : (
            avaliacoes.map(av => (
              <div key={av.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-slate-800">
                        {av.clienteNome ?? av.clienteEmail}
                      </span>
                      <span className="text-xs text-slate-400">{av.clienteEmail}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        av.aprovada ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {av.aprovada ? "Aprovada" : "Pendente"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} style={{ color: i < av.estrelas ? "#f59e0b" : "#e2e8f0" }}>★</span>
                        ))}
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {av.produto.titulo}
                      </span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">
                        {av.criadaEm.toLocaleDateString("pt-PT")}
                      </span>
                    </div>
                    {av.comentario && (
                      <p className="text-sm text-slate-600 leading-relaxed">{av.comentario}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!av.aprovada && (
                      <form action={aprovar.bind(null, av.id)}>
                        <button type="submit"
                          className="rounded-xl px-3 py-1.5 text-xs font-bold bg-green-600 text-white hover:bg-green-700 transition-colors">
                          Aprovar
                        </button>
                      </form>
                    )}
                    <form action={rejeitar.bind(null, av.id)}>
                      <button type="submit"
                        className="rounded-xl px-3 py-1.5 text-xs font-bold bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                        {av.aprovada ? "Remover" : "Rejeitar"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPaginas > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>Página {pagina} de {totalPaginas}</span>
            <div className="flex gap-2">
              {pagina > 1 && (
                <a href={`/dashboard/avaliacoes?filtro=${filtro}&pagina=${pagina - 1}`}
                  className="rounded-lg border border-slate-200 px-3 py-1 hover:bg-white transition-colors">← Anterior</a>
              )}
              {pagina < totalPaginas && (
                <a href={`/dashboard/avaliacoes?filtro=${filtro}&pagina=${pagina + 1}`}
                  className="rounded-lg border border-slate-200 px-3 py-1 hover:bg-white transition-colors">Próxima →</a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
