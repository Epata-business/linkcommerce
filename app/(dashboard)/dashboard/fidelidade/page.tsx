import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { temPermissao } from "@/lib/rbac";
import { formatarPreco } from "@/lib/moeda";

export default async function FidelidadePage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!temPermissao(role, "clientes")) redirect("/dashboard");

  const lojaId = await getLojaId();

  const [loja, config, topClientes, totalMembros] = await Promise.all([
    prisma.loja.findUnique({ where: { id: lojaId }, select: { moeda: true } }),
    prisma.configFidelidade.findUnique({ where: { lojaId } }),
    prisma.pontosFidelidade.findMany({
      where: { lojaId },
      orderBy: { pontos: "desc" },
      take: 20,
    }),
    prisma.pontosFidelidade.count({ where: { lojaId } }),
  ]);

  const moeda = loja?.moeda ?? "EUR";

  async function guardarConfig(formData: FormData) {
    "use server";
    const lid = await getLojaId();
    const ativo = formData.get("ativo") === "1";
    const pontosPorUnidade = parseFloat(formData.get("pontosPorUnidade") as string) || 1;
    const valorPorPonto = parseFloat(formData.get("valorPorPonto") as string) || 0.01;
    const pontosMinResgatar = parseInt(formData.get("pontosMinResgatar") as string) || 100;

    await prisma.configFidelidade.upsert({
      where: { lojaId: lid },
      create: { lojaId: lid, ativo, pontosPorUnidade, valorPorPonto, pontosMinResgatar },
      update: { ativo, pontosPorUnidade, valorPorPonto, pontosMinResgatar },
    });
    revalidatePath("/dashboard/fidelidade");
    redirect("/dashboard/fidelidade");
  }

  async function ajustarPontos(formData: FormData) {
    "use server";
    const lid = await getLojaId();
    const clienteEmail = formData.get("clienteEmail") as string;
    const delta = parseInt(formData.get("delta") as string);
    const nota = (formData.get("nota") as string)?.trim() || "Ajuste manual";
    if (!clienteEmail || isNaN(delta) || delta === 0) return;

    await prisma.$transaction(async (tx) => {
      const saldo = await tx.pontosFidelidade.upsert({
        where: { lojaId_clienteEmail: { lojaId: lid, clienteEmail } },
        create: { lojaId: lid, clienteEmail, pontos: Math.max(0, delta), totalGanho: delta > 0 ? delta : 0 },
        update: {
          pontos: { increment: delta },
          totalGanho: delta > 0 ? { increment: delta } : undefined,
          totalGasto: delta < 0 ? { increment: Math.abs(delta) } : undefined,
        },
      });
      await tx.movimentoPontos.create({
        data: { saldoId: saldo.id, tipo: "AJUSTE", pontos: delta, nota },
      });
    });
    revalidatePath("/dashboard/fidelidade");
    redirect("/dashboard/fidelidade");
  }

  const simbolo = moeda === "AOA" ? "Kz" : "€";
  const totalPontosEmCirculacao = topClientes.reduce((s, c) => s + c.pontos, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900">Programa de Fidelidade</h1>
          <p className="text-slate-400 text-sm mt-1">Recompensa os teus clientes por cada compra</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold mb-1">Membros</p>
            <p className="text-2xl font-black text-slate-900">{totalMembros}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold mb-1">Pontos em circulação</p>
            <p className="text-2xl font-black text-slate-900">{totalPontosEmCirculacao.toLocaleString("pt-PT")}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold mb-1">Estado</p>
            <p className={`text-2xl font-black ${config?.ativo ? "text-green-600" : "text-slate-400"}`}>
              {config?.ativo ? "Ativo" : "Inativo"}
            </p>
          </div>
        </div>

        {/* Configuração */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
          <h2 className="font-bold text-slate-800 mb-4">Configuração</h2>
          <form action={guardarConfig} className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="hidden" name="ativo" value="0" />
              <input type="checkbox" name="ativo" value="1" defaultChecked={config?.ativo ?? false}
                className="w-4 h-4 rounded" />
              <span className="text-sm font-semibold text-slate-700">Programa ativo</span>
            </label>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Pontos por {simbolo} gasto
                </label>
                <input
                  name="pontosPorUnidade"
                  type="number"
                  step="0.1"
                  min="0.1"
                  defaultValue={Number(config?.pontosPorUnidade ?? 1)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <p className="mt-1 text-xs text-slate-400">Ex: 1 ponto por cada {simbolo} gasto</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Valor de 1 ponto ({simbolo})
                </label>
                <input
                  name="valorPorPonto"
                  type="number"
                  step="0.001"
                  min="0.001"
                  defaultValue={Number(config?.valorPorPonto ?? 0.01)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <p className="mt-1 text-xs text-slate-400">Ex: 0,01{simbolo} por ponto = 100 pts → 1{simbolo}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Mínimo para resgatar
                </label>
                <input
                  name="pontosMinResgatar"
                  type="number"
                  min="1"
                  defaultValue={config?.pontosMinResgatar ?? 100}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <p className="mt-1 text-xs text-slate-400">Mínimo de pontos para usar num pedido</p>
              </div>
            </div>

            {config && (
              <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600 border border-slate-100">
                <strong>Exemplo:</strong> compra de 50{simbolo} → {Math.floor(50 * Number(config.pontosPorUnidade))} pontos → vale {(Math.floor(50 * Number(config.pontosPorUnidade)) * Number(config.valorPorPonto)).toFixed(2)}{simbolo}
              </div>
            )}

            <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
              Guardar configuração
            </button>
          </form>
        </div>

        {/* Top clientes por pontos */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Clientes com pontos</h2>
          </div>
          {topClientes.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Nenhum cliente com pontos ainda. Ativa o programa e as compras começam a acumular.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                  <th className="px-4 py-3 text-right">Total ganho</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topClientes.map((c, i) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {i < 3 && <span className="text-base">{["🥇","🥈","🥉"][i]}</span>}
                        <div>
                          <p className="font-semibold text-slate-800">{c.clienteNome ?? "—"}</p>
                          <p className="text-xs text-slate-400">{c.clienteEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900 tabular-nums">
                      {c.pontos.toLocaleString("pt-PT")} pts
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 tabular-nums">
                      {c.totalGanho.toLocaleString("pt-PT")}
                    </td>
                    <td className="px-4 py-3 text-right text-indigo-600 font-semibold tabular-nums">
                      {config ? formatarPreco(c.pontos * Number(config.valorPorPonto), moeda) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Ajuste manual de pontos */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 mb-4">Ajuste manual de pontos</h2>
          <form action={ajustarPontos} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email do cliente</label>
              <input name="clienteEmail" required placeholder="cliente@exemplo.ao"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pontos (positivo = adicionar, negativo = remover)</label>
              <input name="delta" type="number" required placeholder="ex: 50 ou -20"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nota (opcional)</label>
              <input name="nota" placeholder="Ex: Oferta especial de aniversário"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700 transition-colors">
                Aplicar ajuste
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
