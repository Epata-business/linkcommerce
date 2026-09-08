import Link from "next/link";
import { cookies } from "next/headers";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StorePreviewButton } from "@/components/dashboard/store-preview-button";
import { DashboardLocaleSwitcher } from "@/components/dashboard/locale-switcher";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

const navLinks = [
  { href: "/dashboard", label: "Início" },
  { href: "/dashboard/produtos", label: "Produtos" },
  { href: "/dashboard/pedidos", label: "Pedidos" },
  { href: "/dashboard/clientes", label: "Clientes" },
  { href: "/dashboard/marketing", label: "Marketing" },
  { href: "/dashboard/envios", label: "Envios" },
  { href: "/dashboard/qrcode", label: "QR Code" },
  { href: "/dashboard/configuracoes", label: "Configurações" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const role = (session.user as { role?: string }).role;
  const lojaId = (session.user as { lojaId?: string }).lojaId;
  const jar = cookies();
  const adminOverride = jar.get("admin_loja_override")?.value;
  const currentLang = jar.get("LC")?.value ?? "pt";

  // Admin sem override → vai para o painel admin
  if (role === "ADMIN_PLATAFORMA" && !adminOverride) redirect("/admin");

  // Lojista sem loja → onboarding (escolher plano primeiro)
  if (role !== "ADMIN_PLATAFORMA" && !lojaId) {
    redirect("/onboarding");
  }

  // Nome da loja que o admin está a ver
  let nomeLojaAdmin: string | null = null;
  if (role === "ADMIN_PLATAFORMA" && adminOverride) {
    const loja = await prisma.loja.findUnique({ where: { id: adminOverride }, select: { nome: true } });
    nomeLojaAdmin = loja?.nome ?? null;
  }

  // Subdomínio, nome e moeda da loja do utilizador actual
  const lojaAtualId = lojaId ?? (role === "ADMIN_PLATAFORMA" && adminOverride ? adminOverride : null);
  const lojaAtual = lojaAtualId
    ? await prisma.loja.findUnique({
        where: { id: lojaAtualId },
        select: { subdominio: true, nome: true, moeda: true },
      })
    : null;

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

          {lojaAtual && (
            <div className="px-2 pb-3">
              <StorePreviewButton subdominio={lojaAtual.subdominio} nomeLoja={lojaAtual.nome} />
            </div>
          )}

          <div className="border-t border-slate-800 px-2 py-3">
            <DashboardLocaleSwitcher currentLang={currentLang} currentMoeda={lojaAtual?.moeda ?? "EUR"} />
          </div>

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
