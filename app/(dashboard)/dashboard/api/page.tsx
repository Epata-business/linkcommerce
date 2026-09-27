"use server";

import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { temPermissao } from "@/lib/rbac";
import { gerarApiKey } from "@/lib/api-auth";
import { BackButton } from "@/components/ui/back-button";
import { CopiarChave } from "./copiar-chave";
import { randomBytes } from "crypto";

const EVENTOS_DISPONIVEIS = [
  { valor: "pedido.criado", label: "Pedido criado" },
  { valor: "pedido.pago", label: "Pedido pago/confirmado" },
  { valor: "pedido.enviado", label: "Pedido enviado" },
  { valor: "pedido.entregue", label: "Pedido entregue" },
  { valor: "pedido.cancelado", label: "Pedido cancelado" },
  { valor: "pagamento.confirmado", label: "Pagamento confirmado" },
];

export default async function ApiPage({
  searchParams,
}: {
  searchParams: { nova?: string };
}) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!temPermissao(role, "configuracoes")) redirect("/dashboard");

  const lojaId = await getLojaId();
  const chaveNova = searchParams.nova; // passada na URL apenas uma vez após criação

  const [keys, webhooks] = await Promise.all([
    prisma.apiKey.findMany({ where: { lojaId }, orderBy: { criadaEm: "desc" } }),
    prisma.webhook.findMany({ where: { lojaId }, orderBy: { criadoEm: "desc" } }),
  ]);

  async function criarKey(formData: FormData) {
    "use server";
    const lojaIdSrv = await getLojaId();
    const nome = (formData.get("nome") as string)?.trim();
    if (!nome) return;
    const { chave, hash, prefixo } = gerarApiKey();
    await prisma.apiKey.create({ data: { lojaId: lojaIdSrv, nome, keyHash: hash, prefixo } });
    revalidatePath("/dashboard/api");
    redirect(`/dashboard/api?nova=${encodeURIComponent(chave)}`);
  }

  async function revogarKey(formData: FormData) {
    "use server";
    const lojaIdSrv = await getLojaId();
    const id = formData.get("id") as string;
    await prisma.apiKey.updateMany({ where: { id, lojaId: lojaIdSrv }, data: { ativa: false } });
    revalidatePath("/dashboard/api");
    redirect("/dashboard/api");
  }

  async function criarWebhook(formData: FormData) {
    "use server";
    const lojaIdSrv = await getLojaId();
    const url = (formData.get("url") as string)?.trim();
    if (!url || !url.startsWith("https://")) return;
    const eventosRaw = formData.getAll("eventos") as string[];
    if (eventosRaw.length === 0) return;
    const secret = `whsec_${randomBytes(24).toString("hex")}`;
    await prisma.webhook.create({ data: { lojaId: lojaIdSrv, url, secret, eventos: eventosRaw } });
    revalidatePath("/dashboard/api");
    redirect("/dashboard/api");
  }

  async function eliminarWebhook(formData: FormData) {
    "use server";
    const lojaIdSrv = await getLojaId();
    const id = formData.get("id") as string;
    await prisma.webhook.deleteMany({ where: { id, lojaId: lojaIdSrv } });
    revalidatePath("/dashboard/api");
    redirect("/dashboard/api");
  }

  async function toggleWebhook(formData: FormData) {
    "use server";
    const lojaIdSrv = await getLojaId();
    const id = formData.get("id") as string;
    const ativo = formData.get("ativo") === "1";
    await prisma.webhook.updateMany({ where: { id, lojaId: lojaIdSrv }, data: { ativo } });
    revalidatePath("/dashboard/api");
    redirect("/dashboard/api");
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://linkcommerce.cc";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <BackButton href="/dashboard/configuracoes" label="← Configurações" />

        <div className="mt-4 mb-8">
          <h1 className="text-2xl font-black text-slate-900">API Pública</h1>
          <p className="text-slate-400 text-sm mt-1">
            Integra a tua loja com ERPs, apps móveis e outros sistemas externos.
          </p>
        </div>

        {/* Chave recém-criada — mostrar apenas uma vez */}
        {chaveNova && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5">
            <p className="text-sm font-bold text-green-800 mb-2">✓ Chave criada — guarda-a agora, não será mostrada novamente</p>
            <CopiarChave chave={chaveNova} />
          </div>
        )}

        {/* Criar nova key */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-slate-800 mb-4">Criar nova chave</h2>
          <form action={criarKey} className="flex gap-3 flex-wrap">
            <input
              name="nome"
              required
              placeholder="Ex: ERP Luanda, App Mobile…"
              maxLength={60}
              className="flex-1 min-w-0 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="submit"
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex-shrink-0"
            >
              Criar chave
            </button>
          </form>
        </div>

        {/* Lista de keys */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Chaves activas</h2>
          </div>
          {keys.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">Sem chaves criadas.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {keys.map(k => (
                <div key={k.id} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{k.nome}</p>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">{k.prefixo}••••••••</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Criada {new Date(k.criadaEm).toLocaleDateString("pt-PT")}
                      {k.ultimoUso && ` · Último uso ${new Date(k.ultimoUso).toLocaleDateString("pt-PT")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${k.ativa ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                      {k.ativa ? "Activa" : "Revogada"}
                    </span>
                    {k.ativa && (
                      <form action={revogarKey}>
                        <input type="hidden" name="id" value={k.id} />
                        <button
                          type="submit"
                          className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                        >
                          Revogar
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── WEBHOOKS ──────────────────────────────────────────────── */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Webhooks</h2>
          <p className="text-sm text-slate-500 mb-4">
            Recebe notificações HTTP em tempo real quando ocorrem eventos na tua loja.
            Cada pedido é assinado com <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">X-LinkCommerce-Signature: sha256=...</code>
          </p>

          {/* Criar webhook */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-4">
            <h3 className="font-bold text-slate-800 mb-4 text-sm">Novo webhook</h3>
            <form action={criarWebhook} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">URL (HTTPS obrigatório)</label>
                <input
                  name="url"
                  required
                  placeholder="https://meuapp.ao/webhooks/linkcommerce"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Eventos</label>
                <div className="grid grid-cols-2 gap-2">
                  {EVENTOS_DISPONIVEIS.map(ev => (
                    <label key={ev.valor} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="checkbox" name="eventos" value={ev.valor} className="rounded" />
                      {ev.label}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                Criar webhook
              </button>
            </form>
          </div>

          {/* Lista de webhooks */}
          {webhooks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-8 text-center text-slate-400 text-sm shadow-sm">
              Nenhum webhook configurado.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-50">
                {webhooks.map(wh => (
                  <div key={wh.id} className="px-5 py-4 flex items-start gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono font-semibold text-slate-800 truncate">{wh.url}</p>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
                        Secret: <span className="text-slate-300">{wh.secret.slice(0, 14)}••••••••</span>
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {wh.eventos.map(ev => (
                          <span key={ev} className="text-[10px] font-mono bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">{ev}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <form action={toggleWebhook}>
                        <input type="hidden" name="id" value={wh.id} />
                        <input type="hidden" name="ativo" value={wh.ativo ? "0" : "1"} />
                        <button type="submit" className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${wh.ativo ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}>
                          {wh.ativo ? "Ativo" : "Inativo"}
                        </button>
                      </form>
                      <form action={eliminarWebhook}>
                        <input type="hidden" name="id" value={wh.id} />
                        <button type="submit" className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors">
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Documentação inline */}
        <div className="bg-slate-900 rounded-2xl p-6 text-slate-300 text-sm space-y-5">
          <h2 className="text-white font-bold text-base">Referência da API</h2>

          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Autenticação</p>
            <code className="block bg-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-green-400">
              Authorization: Bearer lc_xxxxxxxxxxxxxxxx
            </code>
          </div>

          {[
            {
              metodo: "GET",
              path: "/api/v1/produtos",
              desc: "Lista produtos da loja",
              params: "?pagina=1&limite=20&ativo=true",
            },
            {
              metodo: "GET",
              path: "/api/v1/pedidos",
              desc: "Lista pedidos da loja",
              params: "?pagina=1&limite=20&status=PROCESSING&desde=2026-01-01",
            },
            {
              metodo: "GET",
              path: "/api/v1/stock",
              desc: "Stock por produto",
              params: "?sku=ABC123",
            },
            {
              metodo: "PATCH",
              path: "/api/v1/stock",
              desc: "Ajustar stock",
              params: `{ "produtoId": "...", "delta": 10, "nota": "Reposição ERP" }`,
            },
          ].map(e => (
            <div key={e.path + e.metodo} className="border-t border-slate-800 pt-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${e.metodo === "GET" ? "bg-blue-900 text-blue-300" : "bg-amber-900 text-amber-300"}`}>
                  {e.metodo}
                </span>
                <code className="text-xs font-mono text-white">{baseUrl}{e.path}</code>
              </div>
              <p className="text-xs text-slate-400">{e.desc}</p>
              <code className="block mt-1 text-xs font-mono text-slate-500">{e.params}</code>
            </div>
          ))}

          <p className="text-xs text-slate-500 border-t border-slate-800 pt-4">
            Rate limit: 60 pedidos/minuto por chave. Respostas em JSON com paginação cursor.
          </p>
        </div>
      </div>
    </div>
  );
}
