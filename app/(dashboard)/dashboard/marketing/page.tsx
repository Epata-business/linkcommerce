import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getLojaId } from "@/lib/get-loja-id";
import { revalidatePath } from "next/cache";
import { registarAudit } from "@/lib/audit";

export default async function MarketingPage() {
  const lojaId = await getLojaId();

  const [cupoes, loja] = await Promise.all([
    prisma.cupao.findMany({ where: { lojaId }, orderBy: { codigo: "asc" } }),
    prisma.loja.findUnique({ where: { id: lojaId }, select: { moeda: true } }),
  ]);
  const moeda = loja?.moeda ?? "EUR";
  const simbolo = moeda === "AOA" ? "Kz" : "€";

  async function criarCupao(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.lojaId) return;
    const lid = session.user.lojaId as string;

    const dados = {
      lojaId: lid,
      codigo: (formData.get("codigo") as string).toUpperCase().trim(),
      tipo: formData.get("tipo") as "PERCENTAGEM" | "VALOR_FIXO",
      valor: Number(formData.get("valor")),
      validade: formData.get("validade") ? new Date(formData.get("validade") as string) : null,
      usosMaximos: formData.get("usosMaximos") ? Number(formData.get("usosMaximos")) : null,
    };

    await prisma.cupao.create({ data: dados });
    void registarAudit({ lojaId: lid, userId: (session.user as { id?: string }).id, userEmail: session.user.email ?? undefined, acao: "CRIAR", entidade: "Cupao", valoresNovos: dados as Record<string, unknown> });
    revalidatePath("/dashboard/marketing");
  }

  async function toggleCupao(id: string, ativo: boolean) {
    "use server";
    await prisma.cupao.update({ where: { id }, data: { ativo } });
    revalidatePath("/dashboard/marketing");
  }

  async function eliminarCupao(id: string) {
    "use server";
    const session = await auth();
    const lid = (session?.user as { lojaId?: string })?.lojaId;
    if (!lid) return;
    // Só elimina se o cupão não foi utilizado (segurança de histórico)
    const cupao = await prisma.cupao.findFirst({ where: { id, lojaId: lid } });
    if (!cupao || cupao.usosAtuais > 0) return;
    await prisma.cupao.delete({ where: { id } });
    void registarAudit({ lojaId: lid, userId: (session?.user as { id?: string })?.id, userEmail: session?.user?.email ?? undefined, acao: "REMOVER", entidade: "Cupao", entidadeId: id, valoresAntigos: { codigo: cupao.codigo } });
    revalidatePath("/dashboard/marketing");
  }

  const hoje = new Date();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900">Marketing</h1>
          <p className="text-slate-400 text-sm mt-1">{cupoes.length} cupão{cupoes.length !== 1 ? "es" : ""}</p>
        </div>

        {/* Criar cupão */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-8">
          <h2 className="text-sm font-bold text-slate-700 mb-4">Criar cupão de desconto</h2>
          <form action={criarCupao} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Código</label>
              <input name="codigo" required placeholder="VERAO25" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</label>
              <select name="tipo" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="PERCENTAGEM">Percentagem (%)</option>
                <option value="VALOR_FIXO">Valor fixo ({simbolo})</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor</label>
              <input name="valor" type="number" step="0.01" min="0.01" required placeholder="20" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Validade (opcional)</label>
              <input name="validade" type="date" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Usos máximos (opcional)</label>
              <input name="usosMaximos" type="number" min="1" placeholder="∞" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                Criar cupão
              </button>
            </div>
          </form>
        </div>

        {/* Lista de cupões */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {cupoes.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">Nenhum cupão criado ainda.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Código</th>
                  <th className="px-4 py-3 text-left">Desconto</th>
                  <th className="px-4 py-3 text-left">Usos</th>
                  <th className="px-4 py-3 text-left">Validade</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cupoes.map(c => {
                  const expirado = c.validade ? c.validade < hoje : false;
                  const esgotado = c.usosMaximos !== null && c.usosAtuais >= c.usosMaximos;
                  const podeEliminar = c.usosAtuais === 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 rounded px-2 py-0.5 text-xs tracking-wider">
                          {c.codigo}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {c.tipo === "PERCENTAGEM"
                          ? `${Number(c.valor)}%`
                          : `${Number(c.valor).toFixed(2)} ${simbolo}`}
                      </td>
                      <td className="px-4 py-3 text-slate-600 tabular-nums">
                        {c.usosAtuais}
                        {c.usosMaximos !== null && (
                          <span className="text-slate-400"> / {c.usosMaximos}</span>
                        )}
                        {esgotado && <span className="ml-1 text-xs text-orange-500">(esgotado)</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {c.validade
                          ? <span className={expirado ? "text-red-500" : ""}>
                              {new Date(c.validade).toLocaleDateString("pt-PT")}
                              {expirado && " (expirado)"}
                            </span>
                          : <span className="text-slate-300">Sem limite</span>}
                      </td>
                      <td className="px-4 py-3">
                        <form action={toggleCupao.bind(null, c.id, !c.ativo)}>
                          <button type="submit" className={`rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors ${c.ativo && !expirado && !esgotado ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                            {c.ativo && !expirado && !esgotado ? "Ativo" : "Inativo"}
                          </button>
                        </form>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {podeEliminar && (
                          <form action={eliminarCupao.bind(null, c.id)}>
                            <button type="submit" className="text-xs text-slate-300 hover:text-red-500 transition-colors">
                              Eliminar
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Cupões com usos registados não podem ser eliminados (histórico de pedidos).
          O código é validado em /api/cupoes/validar e aplicado automaticamente no checkout.
        </p>
      </div>
    </div>
  );
}
