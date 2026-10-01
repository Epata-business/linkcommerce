import Link from "next/link";
import { cookies } from "next/headers";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StorePreviewButton } from "@/components/dashboard/store-preview-button";
import { DashboardLocaleSwitcher } from "@/components/dashboard/locale-switcher";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { NotificacoesBell } from "@/components/dashboard/notificacoes-bell";
import { PushPermissionBtn } from "@/components/dashboard/push-permission-btn";
import { PesquisaGlobal } from "@/components/dashboard/pesquisa-global";
import { NAV_POR_ROLE, type Recurso } from "@/lib/rbac";

const ALL_NAV_LINKS: { href: string; label: string; recurso: Recurso }[] = [
  { href: "/dashboard",               label: "Início",         recurso: "dashboard"      },
  { href: "/dashboard/produtos",      label: "Produtos",       recurso: "produtos"       },
  { href: "/dashboard/inventario",    label: "Inventário",     recurso: "inventario"     },
  { href: "/dashboard/pedidos",       label: "Pedidos",        recurso: "pedidos"        },
  { href: "/dashboard/clientes",      label: "Clientes",       recurso: "clientes"       },
  { href: "/dashboard/marketing",     label: "Marketing",      recurso: "marketing"      },
  { href: "/dashboard/fidelidade",   label: "Fidelidade",     recurso: "fidelidade"     },
  { href: "/dashboard/devolucoes",    label: "Devoluções",     recurso: "devolucoes"     },
  { href: "/dashboard/carrinhos",     label: "Carrinhos",      recurso: "carrinhos"      },
  { href: "/dashboard/envios",        label: "Envios",         recurso: "envios"         },
  { href: "/dashboard/qrcode",        label: "QR Code",        recurso: "qrcode"         },
  { href: "/dashboard/relatorios",    label: "Analytics",      recurso: "relatorios"     },
  { href: "/dashboard/exportar",      label: "Exportar",       recurso: "exportar"       },
  { href: "/dashboard/equipa",        label: "Equipa",         recurso: "equipa"         },
  { href: "/dashboard/auditlog",      label: "Audit Log",      recurso: "auditlog"       },
  { href: "/dashboard/faturas",       label: "Faturas",        recurso: "faturas"        },
  { href: "/dashboard/avaliacoes",    label: "Avaliações",     recurso: "avaliacoes"     },
  { href: "/dashboard/notificacoes",  label: "Notificações",   recurso: "notificacoes"   },
  { href: "/dashboard/api",           label: "API",            recurso: "api"            },
  { href: "/dashboard/temas",         label: "Temas",          recurso: "temas"          },
  { href: "/dashboard/configuracoes", label: "Configurações",  recurso: "configuracoes"  },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const role = (session.user as { role?: string }).role ?? "LOJISTA";
  const jar = cookies();
  const adminOverride = jar.get("admin_loja_override")?.value;
  const currentLang = jar.get("LC")?.value ?? "pt";

  // Filtrar links de nav com base no role
  const recursosPermitidos = NAV_POR_ROLE[role] ?? NAV_POR_ROLE["OPERADOR"];
  const navLinks = ALL_NAV_LINKS.filter(l => recursosPermitidos.includes(l.recurso));

  // Admin sem override → vai para o painel admin
  if (role === "ADMIN_PLATAFORMA" && !adminOverride) redirect("/admin");

  // JWT pode estar desactualizado — fallback à DB para lojaId
  let lojaId = (session.user as { lojaId?: string }).lojaId ?? null;
  if (!lojaId && role !== "ADMIN_PLATAFORMA" && session.user.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { lojaId: true },
    });
    lojaId = dbUser?.lojaId ?? null;
  }

  // Lojista sem loja → onboarding (escolher plano primeiro)
  if (role !== "ADMIN_PLATAFORMA" && !lojaId) {
    redirect("/onboarding");
  }

  // Verificar subscrição activa (apenas o LOJISTA é redirecionado — outros membros dependem do dono)
  if (role === "LOJISTA" && lojaId && !adminOverride) {
    const subscricao = await prisma.subscricao.findUnique({
      where: { lojaId },
      select: { status: true, trialFimEm: true },
    });
    const agora = new Date();
    const trialValido = subscricao?.status === "TRIAL" && subscricao.trialFimEm && subscricao.trialFimEm > agora;
    const acessoPermitido = subscricao?.status === "ATIVA" || trialValido;
    if (!acessoPermitido) {
      redirect("/subscrever");
    }
  }

  // Nome da loja que o admin está a ver
  let nomeLojaAdmin: string | null = null;
  if (role === "ADMIN_PLATAFORMA" && adminOverride) {
    const loja = await prisma.loja.findUnique({ where: { id: adminOverride }, select: { nome: true } });
    nomeLojaAdmin = loja?.nome ?? null;
  }

  // Subdomínio, nome e moeda da loja do utilizador actual
  const lojaAtualId = lojaId ?? (role === "ADMIN_PLATAFORMA" && adminOverride ? adminOverride : null);
  const [lojaAtual, subscricaoAtual, notificacoesData] = lojaAtualId
    ? await Promise.all([
        prisma.loja.findUnique({
          where: { id: lojaAtualId },
          select: { subdominio: true, nome: true, moeda: true },
        }),
        prisma.subscricao.findUnique({
          where: { lojaId: lojaAtualId },
          select: { status: true, proximaCobranca: true, trialFimEm: true, plano: { select: { nome: true } } },
        }),
        Promise.all([
          prisma.notificacao.count({ where: { lojaId: lojaAtualId, lida: false } }),
          prisma.notificacao.findMany({
            where: { lojaId: lojaAtualId },
            orderBy: { criadaEm: "desc" },
            take: 8,
          }),
        ]),
      ])
    : [null, null, null];

  const naoLidas = (notificacoesData as [number, unknown[]] | null)?.[0] ?? 0;
  const recentesNotif = ((notificacoesData as [number, unknown[]] | null)?.[1] ?? []) as Parameters<typeof NotificacoesBell>[0]["recentes"];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Banner admin impersonation */}
      {role === "ADMIN_PLATAFORMA" && (
        <div className="flex items-center justify-between bg-amber-500 px-4 py-2 text-sm font-medium text-white">
          <span>
            👁 A ver como admin: <strong>{nomeLojaAdmin ?? "Loja desconhecida"}</strong>
          </span>
          <Link href="/api/admin/impersonate?sair=1" className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold hover:bg-white/30 transition-colors">
            ← Voltar ao painel admin
          </Link>
        </div>
      )}

      {/* Barra mobile topo */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3 md:hidden">
        <span className="text-base font-bold text-white tracking-tight">LinkCommerce</span>
        <MobileSidebar
          navLinks={navLinks}
          email={session.user.email ?? ""}
          subdominio={lojaAtual?.subdominio ?? null}
          nomeLoja={lojaAtual?.nome ?? null}
          currentLang={currentLang}
          currentMoeda={lojaAtual?.moeda ?? "EUR"}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — apenas desktop */}
        <aside className="hidden md:flex w-56 flex-col border-r border-slate-800 bg-slate-900 text-white">
          <div className="px-4 py-5">
            <span className="text-lg font-bold tracking-tight">LinkCommerce</span>
          </div>
          <DashboardNav links={navLinks} />

          {/* Pesquisa global */}
          <div className="px-3 pb-1">
            <PesquisaGlobal />
          </div>

          {/* Bell de notificações */}
          <div className="px-3 pb-2">
            <NotificacoesBell naoLidas={naoLidas} recentes={recentesNotif} />
          </div>

          {/* Push notifications */}
          <PushPermissionBtn />

          {lojaAtual && (
            <div className="px-2 pb-3">
              <StorePreviewButton subdominio={lojaAtual.subdominio} nomeLoja={lojaAtual.nome} />
            </div>
          )}

          <div className="border-t border-slate-800 px-2 py-3">
            <DashboardLocaleSwitcher currentLang={currentLang} currentMoeda={lojaAtual?.moeda ?? "EUR"} />
          </div>

          {/* Badge do plano / Trial — só ATIVA ou TRIAL */}
          {subscricaoAtual && (subscricaoAtual.status === "ATIVA" || subscricaoAtual.status === "TRIAL") && (
            <div
              className="mx-3 mb-3 rounded-xl px-3 py-2.5"
              style={{
                background: subscricaoAtual.status === "TRIAL"
                  ? "rgba(245,158,11,0.12)"
                  : "rgba(21,61,252,0.15)",
                border: subscricaoAtual.status === "TRIAL"
                  ? "1px solid rgba(245,158,11,0.35)"
                  : "1px solid rgba(21,61,252,0.3)",
              }}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: subscricaoAtual.status === "TRIAL" ? "#f59e0b" : "#818cf8" }}>
                  {subscricaoAtual.status === "TRIAL" ? "Período de teste" : "Plano activo"}
                </span>
                <span className="text-[10px] font-bold" style={{ color: subscricaoAtual.status === "TRIAL" ? "#f59e0b" : "#4ade80" }}>
                  {subscricaoAtual.status === "TRIAL" ? "⏳ TRIAL" : "● ATIVO"}
                </span>
              </div>
              <p className="text-sm font-bold text-white">{subscricaoAtual.plano?.nome ?? "Free"}</p>
              {subscricaoAtual.status === "TRIAL" && subscricaoAtual.trialFimEm && (
                <p className="text-[10px] mt-0.5" style={{ color: "#f59e0b" }}>
                  Expira {new Date((subscricaoAtual as { trialFimEm: Date }).trialFimEm).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
                  {" · "}
                  <a href="/subscrever" className="underline font-semibold">Subscrever agora</a>
                </p>
              )}
              {subscricaoAtual.status === "ATIVA" && subscricaoAtual.proximaCobranca && (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Renova {new Date(subscricaoAtual.proximaCobranca).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
                </p>
              )}
            </div>
          )}

          <div className="border-t border-slate-800 px-4 py-4">
            <p className="truncate text-xs text-slate-400">{session.user.email}</p>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }} className="mt-2">
              <button type="submit" className="text-xs text-slate-500 hover:text-white transition-colors">
                Sair →
              </button>
            </form>
          </div>
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
