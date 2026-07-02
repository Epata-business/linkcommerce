import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getLojaId } from "@/lib/get-loja-id";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { MOEDAS } from "@/lib/moeda";
import { BackButton } from "@/components/ui/back-button";
import Link from "next/link";

export default async function ConfiguracoesPage() {
  const lojaId = await getLojaId();
  const loja = await prisma.loja.findUnique({
    where: { id: lojaId },
    include: { subscricao: { include: { plano: true } }, plano: true },
  });

  if (!loja) redirect("/onboarding");

  async function guardarConfiguracoes(formData: FormData) {
    "use server";
    const lojaIdServer = await getLojaId();

    await prisma.loja.update({
      where: { id: lojaIdServer },
      data: {
        nome: formData.get("nome") as string,
        corPrimaria: formData.get("corPrimaria") as string,
        corSecundaria: formData.get("corSecundaria") as string,
        logotipoUrl: (formData.get("logotipoUrl") as string) || null,
        moeda: formData.get("moeda") as string,
      },
    });

    revalidatePath("/dashboard/configuracoes");
  }

  return (
    <div className="p-6 max-w-2xl">
      <BackButton href="/dashboard" label="← Dashboard" />
      <h1 className="text-2xl font-semibold">Configurações</h1>

      {/* Plano atual */}
      <div className="mt-6 rounded-lg border bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Plano atual</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {loja.subscricao?.plano?.nome ?? loja.plano?.nome ?? "Free"} —{" "}
              {loja.subscricao?.status ?? "TRIAL"}
            </p>
          </div>
          <Link href="/dashboard/configuracoes/planos">
            <Button variant="outline" size="sm">Alterar plano</Button>
          </Link>
        </div>
      </div>

      {/* Dados da loja */}
      <div className="mt-4 rounded-2xl border bg-white p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Dados da loja</h2>
        <form action={guardarConfiguracoes} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome da loja</label>
            <input name="nome" required defaultValue={loja.nome}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL do logótipo</label>
            <input name="logotipoUrl" defaultValue={loja.logotipoUrl ?? ""} placeholder="https://..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cor primária</label>
              <div className="flex items-center gap-2">
                <input name="corPrimaria" type="color" defaultValue={loja.corPrimaria}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200" />
                <span className="text-sm text-slate-500 font-mono">{loja.corPrimaria}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cor secundária</label>
              <div className="flex items-center gap-2">
                <input name="corSecundaria" type="color" defaultValue={loja.corSecundaria}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200" />
                <span className="text-sm text-slate-500 font-mono">{loja.corSecundaria}</span>
              </div>
            </div>
          </div>

          {/* Moeda */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Moeda da loja</label>
            <select name="moeda" defaultValue={loja.moeda ?? "EUR"}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100">
              {MOEDAS.map((m) => (
                <option key={m.codigo} value={m.codigo}>
                  {m.simbolo} — {m.nome} ({m.codigo})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Afeta como os preços são apresentados na loja e nos relatórios.
            </p>
          </div>

          <div className="pt-1">
            <p className="text-xs text-muted-foreground">
              Subdomínio: <strong>{loja.subdominio}.linkcommerce.app</strong>
            </p>
          </div>
          <Button type="submit">Guardar alterações</Button>
        </form>
      </div>
    </div>
  );
}
