import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getLojaId } from "@/lib/get-loja-id";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { MOEDAS } from "@/lib/moeda";
import { BackButton } from "@/components/ui/back-button";
import Link from "next/link";

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
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
        nif: (formData.get("nif") as string) || null,
        moradaFiscal: (formData.get("moradaFiscal") as string) || null,
        telefoneWA: (formData.get("telefoneWA") as string) || null,
      },
    });

    revalidatePath("/dashboard/configuracoes");
    redirect("/dashboard/configuracoes?saved=1");
  }

  async function guardarDominioProprio(formData: FormData) {
    "use server";
    const lojaIdServer = await getLojaId();
    const lojaAtual = await prisma.loja.findUnique({
      where: { id: lojaIdServer },
      select: { planoId: true, plano: { select: { permiteDominioProprio: true } }, subscricao: { select: { plano: { select: { permiteDominioProprio: true } } } } },
    });
    const permitido =
      lojaAtual?.subscricao?.plano?.permiteDominioProprio ||
      lojaAtual?.plano?.permiteDominioProprio;
    if (!permitido) return;

    const dominio = (formData.get("dominioProprio") as string)?.toLowerCase().trim() || null;
    // Validação básica: sem espaços, sem protocolo, sem path
    if (dominio && (dominio.includes(" ") || dominio.startsWith("http") || dominio.includes("/"))) return;

    await prisma.loja.update({
      where: { id: lojaIdServer },
      data: { dominioProprio: dominio || null },
    });
    revalidatePath("/dashboard/configuracoes");
    redirect("/dashboard/configuracoes?saved=1");
  }

  async function guardarSeo(formData: FormData) {
    "use server";
    const lojaIdServer = await getLojaId();
    await prisma.loja.update({
      where: { id: lojaIdServer },
      data: {
        seoTitulo: (formData.get("seoTitulo") as string) || null,
        seoDescricao: (formData.get("seoDescricao") as string) || null,
      },
    });
    revalidatePath("/dashboard/configuracoes");
    redirect("/dashboard/configuracoes?saved=1");
  }

  async function guardarWhatsAppAPI(formData: FormData) {
    "use server";
    const lojaIdServer = await getLojaId();
    await prisma.loja.update({
      where: { id: lojaIdServer },
      data: {
        waPhoneId: (formData.get("waPhoneId") as string) || null,
        waToken: (formData.get("waToken") as string) || null,
      },
    });
    revalidatePath("/dashboard/configuracoes");
    redirect("/dashboard/configuracoes?saved=1");
  }

  return (
    <div className="p-6 max-w-2xl">
      <BackButton href="/dashboard" label="← Dashboard" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <Link href="/dashboard/configuracoes/perfil"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          O meu perfil
        </Link>
      </div>

      {searchParams.saved === "1" && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Alterações guardadas com sucesso.
        </div>
      )}

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

          {/* WhatsApp */}
          <div className="border-t border-slate-100 pt-4 mt-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-1">WhatsApp da loja</h3>
            <p className="text-xs text-slate-400 mb-3">Número de contacto exibido na loja. Os clientes podem clicar para iniciar conversa.</p>
            <input name="telefoneWA" defaultValue={loja.telefoneWA ?? ""} placeholder="+244 900 000 000"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
          </div>

          {/* Dados fiscais */}
          <div className="border-t border-slate-100 pt-4 mt-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Dados fiscais (para faturas)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NIF da loja</label>
                <input name="nif" defaultValue={loja.nif ?? ""} placeholder="Ex: 5000000000"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Morada fiscal completa</label>
                <textarea name="moradaFiscal" defaultValue={loja.moradaFiscal ?? ""} rows={2}
                  placeholder="Rua Exemplo, nº 1, Luanda, Angola"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none" />
              </div>
            </div>
          </div>

          <div className="pt-1">
            <p className="text-xs text-muted-foreground">
              Subdomínio: <strong>{loja.subdominio}.linkcommerce.cc</strong>
            </p>
          </div>
          <Button type="submit">Guardar alterações</Button>
        </form>
      </div>

      {/* WhatsApp Business API */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.525 5.847L.057 23.18c-.097.32.004.668.254.894.18.161.414.245.652.245.08 0 .16-.009.24-.028l5.47-1.43A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.802 9.802 0 01-5.002-1.373l-.358-.215-3.718.972.992-3.62-.234-.373A9.79 9.79 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">WhatsApp Business API</h2>
            <p className="text-xs text-slate-400">Envio automático de notificações aos clientes e à loja.</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700 mb-4">
          <strong>Opcional.</strong> Requer conta Meta Business com WhatsApp Business API aprovada.
          Sem esta configuração, as notificações são enviadas apenas por email.
        </div>

        <form action={guardarWhatsAppAPI} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone Number ID</label>
            <input name="waPhoneId" defaultValue={loja.waPhoneId ?? ""} placeholder="123456789012345"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Token de acesso</label>
            <input name="waToken" type="password" defaultValue={loja.waToken ? "••••••••••••" : ""} placeholder="EAAxxxxxxx…"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            <p className="mt-1 text-xs text-slate-400">Obtém em Meta for Developers → WhatsApp → API Setup.</p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button type="submit" variant="outline" className="text-sm">Guardar credenciais WA</Button>
            {loja.waPhoneId && loja.waToken && (
              <span className="text-xs text-green-600 font-semibold">● Configurado</span>
            )}
          </div>
        </form>
      </div>
      {/* Domínio Próprio */}
      {(() => {
        const permiteDominio =
          loja.subscricao?.plano?.permiteDominioProprio ||
          loja.plano?.permiteDominioProprio;
        return (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Domínio próprio</h2>
                <p className="text-xs text-slate-400 mt-0.5">Usa o teu domínio (ex: loja.meunegocio.ao) em vez do subdomínio LinkCommerce.</p>
              </div>
            </div>

            {!permiteDominio ? (
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-4 text-center">
                <p className="text-sm text-slate-500 mb-2">Disponível nos planos <strong>Growth</strong> e <strong>Enterprise</strong>.</p>
                <a href="/dashboard/configuracoes/planos" className="inline-block text-sm font-semibold text-indigo-600 hover:underline">
                  Ver planos →
                </a>
              </div>
            ) : (
              <form action={guardarDominioProprio} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Domínio (sem https://)</label>
                  <input
                    name="dominioProprio"
                    defaultValue={loja.dominioProprio ?? ""}
                    placeholder="loja.meusite.ao"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <p className="mt-1 text-xs text-slate-400">Deixar vazio remove o domínio próprio.</p>
                </div>

                {loja.dominioProprio && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-xs text-blue-800 space-y-1">
                    <p className="font-semibold mb-2">Configuração DNS necessária:</p>
                    <p>Adiciona um registo <strong>CNAME</strong> no teu painel DNS:</p>
                    <div className="font-mono bg-white rounded-lg px-3 py-2 border border-blue-100 mt-1">
                      <span className="text-slate-500">{loja.dominioProprio}</span>
                      <span className="text-slate-400 mx-2">→</span>
                      <span className="text-indigo-700">cname.vercel-dns.com</span>
                    </div>
                    <p className="mt-2 text-blue-600">A propagação DNS pode demorar até 48h. Após propagar, a loja fica disponível no teu domínio.</p>
                  </div>
                )}

                <Button type="submit" variant="outline" className="text-sm">Guardar domínio</Button>
              </form>
            )}
          </div>
        );
      })()}

      {/* SEO */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">SEO — Motores de pesquisa</h2>
            <p className="text-xs text-slate-400 mt-0.5">Personaliza o título e descrição que aparecem no Google e redes sociais.</p>
          </div>
        </div>
        <form action={guardarSeo} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Título da loja <span className="text-slate-400 font-normal">(SEO override)</span>
            </label>
            <input
              name="seoTitulo"
              defaultValue={loja.seoTitulo ?? ""}
              placeholder={loja.nome}
              maxLength={70}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <p className="mt-1 text-xs text-slate-400">Máx. 70 caracteres. Deixar vazio usa o nome da loja.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Meta description <span className="text-slate-400 font-normal">(SEO override)</span>
            </label>
            <textarea
              name="seoDescricao"
              defaultValue={loja.seoDescricao ?? ""}
              placeholder={`Compre online na ${loja.nome}. Entrega rápida e pagamento seguro.`}
              maxLength={160}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
            />
            <p className="mt-1 text-xs text-slate-400">Máx. 160 caracteres. Aparece nos resultados de pesquisa e partilhas.</p>
          </div>
          <Button type="submit" variant="outline" className="text-sm">Guardar SEO</Button>
        </form>
      </div>
    </div>
  );
}
