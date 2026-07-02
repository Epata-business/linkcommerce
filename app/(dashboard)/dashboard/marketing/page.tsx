import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getLojaId } from "@/lib/get-loja-id";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";

export default async function MarketingPage() {
  const lojaId = await getLojaId();

  const cupoes = await prisma.cupao.findMany({
    where: { lojaId },
    orderBy: { codigo: "asc" },
  });

  async function criarCupao(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.lojaId) return;

    await prisma.cupao.create({
      data: {
        lojaId: session.user.lojaId as string,
        codigo: (formData.get("codigo") as string).toUpperCase(),
        tipo: formData.get("tipo") as "PERCENTAGEM" | "VALOR_FIXO",
        valor: Number(formData.get("valor")),
        validade: formData.get("validade") ? new Date(formData.get("validade") as string) : null,
        usosMaximos: formData.get("usosMaximos") ? Number(formData.get("usosMaximos")) : null,
      },
    });

    revalidatePath("/dashboard/marketing");
  }

  async function toggleCupao(id: string, ativo: boolean) {
    "use server";
    await prisma.cupao.update({ where: { id }, data: { ativo } });
    revalidatePath("/dashboard/marketing");
  }

  return (
    <div className="p-6">
      <BackButton href="/dashboard" label="← Dashboard" />
      <h1 className="text-2xl font-semibold">Marketing</h1>

      {/* Formulário novo cupão */}
      <div className="mt-6 rounded-lg border bg-white p-5">
        <h2 className="font-semibold">Criar cupão de desconto</h2>
        <form action={criarCupao} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-sm font-medium">Código</label>
            <input name="codigo" required placeholder="VERAO20" className="mt-1 w-full rounded border px-3 py-2 text-sm uppercase" />
          </div>
          <div>
            <label className="text-sm font-medium">Tipo</label>
            <select name="tipo" className="mt-1 w-full rounded border px-3 py-2 text-sm">
              <option value="PERCENTAGEM">Percentagem (%)</option>
              <option value="VALOR_FIXO">Valor fixo (€)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Valor</label>
            <input name="valor" type="number" step="0.01" min="0" required placeholder="20" className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Validade (opcional)</label>
            <input name="validade" type="date" className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Usos máximos (opcional)</label>
            <input name="usosMaximos" type="number" min="1" placeholder="100" className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">Criar cupão</Button>
          </div>
        </form>
      </div>

      {/* Lista de cupões */}
      <div className="mt-6 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Código</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Valor</th>
              <th className="p-3">Usos</th>
              <th className="p-3">Validade</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {cupoes.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Ainda não criou nenhum cupão.
                </td>
              </tr>
            )}
            {cupoes.map((cupao) => (
              <tr key={cupao.id} className="border-t">
                <td className="p-3 font-mono font-medium">{cupao.codigo}</td>
                <td className="p-3">{cupao.tipo === "PERCENTAGEM" ? "%" : "€"}</td>
                <td className="p-3">
                  {cupao.tipo === "PERCENTAGEM"
                    ? `${Number(cupao.valor)}%`
                    : Number(cupao.valor).toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                </td>
                <td className="p-3">
                  {cupao.usosAtuais}{cupao.usosMaximos ? ` / ${cupao.usosMaximos}` : ""}
                </td>
                <td className="p-3 text-muted-foreground">
                  {cupao.validade ? new Date(cupao.validade).toLocaleDateString("pt-PT") : "Sem limite"}
                </td>
                <td className="p-3">
                  <form action={toggleCupao.bind(null, cupao.id, !cupao.ativo)}>
                    <button type="submit" className={`rounded-full px-2 py-0.5 text-xs font-medium ${cupao.ativo ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
                      {cupao.ativo ? "Ativo" : "Inativo"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
