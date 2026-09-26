import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { temPermissao } from "@/lib/rbac";

const ACAO_CORES: Record<string, string> = {
  CRIAR:     "bg-green-100 text-green-700",
  ATUALIZAR: "bg-blue-100 text-blue-700",
  CANCELAR:  "bg-orange-100 text-orange-700",
  REMOVER:   "bg-red-100 text-red-700",
  ADICIONAR: "bg-indigo-100 text-indigo-700",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { entidade?: string; pagina?: string };
}) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!temPermissao(role, "auditlog")) redirect("/dashboard");

  const lojaId = await getLojaId();
  const pagina = Math.max(1, parseInt(searchParams.pagina ?? "1", 10));
  const porPagina = 30;

  const onde = {
    lojaId,
    ...(searchParams.entidade ? { entidade: searchParams.entidade } : {}),
  };

  const [total, registos] = await Promise.all([
    prisma.auditLog.count({ where: onde }),
    prisma.auditLog.findMany({
      where: onde,
      orderBy: { criadoEm: "desc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
  ]);

  const totalPaginas = Math.ceil(total / porPagina);

  const entidades = await prisma.auditLog.findMany({
    where: { lojaId },
    select: { entidade: true },
    distinct: ["entidade"],
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Audit Log</h1>
            <p className="text-slate-400 text-sm mt-1">{total} registo{total !== 1 ? "s" : ""}</p>
          </div>

          {/* Filtro por entidade */}
          <div className="flex gap-2 flex-wrap">
            <a
              href="/dashboard/auditlog"
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${!searchParams.entidade ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
            >
              Todas
            </a>
            {entidades.map(e => (
              <a
                key={e.entidade}
                href={`/dashboard/auditlog?entidade=${e.entidade}`}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${searchParams.entidade === e.entidade ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
              >
                {e.entidade}
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {registos.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">Nenhum registo ainda.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Utilizador</th>
                  <th className="px-4 py-3 text-left">Ação</th>
                  <th className="px-4 py-3 text-left">Entidade</th>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Alterações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {registos.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 tabular-nums text-xs">
                      {r.criadoEm.toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-[160px] truncate">
                      {r.userEmail ?? r.userId ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ACAO_CORES[r.acao] ?? "bg-slate-100 text-slate-600"}`}>
                        {r.acao}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{r.entidade}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs font-mono max-w-[100px] truncate">
                      {r.entidadeId ?? "—"}
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <DiffCell antigos={r.valoresAntigos} novos={r.valoresNovos} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>Página {pagina} de {totalPaginas}</span>
            <div className="flex gap-2">
              {pagina > 1 && (
                <a href={`/dashboard/auditlog?${searchParams.entidade ? `entidade=${searchParams.entidade}&` : ""}pagina=${pagina - 1}`}
                  className="rounded-lg border border-slate-200 px-3 py-1 hover:bg-white transition-colors">
                  ← Anterior
                </a>
              )}
              {pagina < totalPaginas && (
                <a href={`/dashboard/auditlog?${searchParams.entidade ? `entidade=${searchParams.entidade}&` : ""}pagina=${pagina + 1}`}
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

function DiffCell({
  antigos,
  novos,
}: {
  antigos: unknown;
  novos: unknown;
}) {
  if (!antigos && !novos) return <span className="text-slate-300">—</span>;

  const renderObj = (obj: unknown) => {
    if (!obj || typeof obj !== "object") return null;
    return Object.entries(obj as Record<string, unknown>)
      .slice(0, 3)
      .map(([k, v]) => (
        <span key={k} className="inline-flex items-center gap-1 mr-1">
          <span className="text-slate-400">{k}:</span>
          <span className="font-medium truncate max-w-[60px]">{String(v)}</span>
        </span>
      ));
  };

  if (antigos && novos) {
    return (
      <div className="text-xs space-y-0.5">
        <div className="text-red-500 line-through opacity-60">{renderObj(antigos)}</div>
        <div className="text-green-600">{renderObj(novos)}</div>
      </div>
    );
  }
  return (
    <div className="text-xs text-slate-600">{renderObj(antigos ?? novos)}</div>
  );
}
