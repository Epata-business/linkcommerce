import Link from "next/link";
import { cookies } from "next/headers";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StorePreviewButton } from "@/components/dashboard/store-preview-button";
import { DashboardLocaleSwitcher } from "@/components/dashboard/locale-switcher";

const navLinks = [
  { href: "/dashboard", label: "Início" },
  { href: "/dashboard/produtos", label: "Produtos" },
  { href: "/dashboard/pedidos", label: "Pedidos" },
  { href: "/dashboard/clientes", label: "Clientes" },
  { href: "/dashboard/marketing", label: "Marketing" },
  { href: "/dashboard/envios", label: "Envios" },
  { href: "/dashboard/configuracoes", label: "Configurações" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const role = (session.user as { role?: string }).role;
  const jar = cookies();
  const adminOverride = jar.get("admin_loja_override")?.value;
  const currentLang = jar.get("LC")?.value ?? "pt";

  // Admin sem override → vai para o painel admin
  if (role === "ADMIN_PLATAFORMA" && !adminOverride) redirect("/admin");

  // Nome da loja que o admin está a ver
  let nomeLojaAdmin: string | null = null;
  if (role === "ADMIN_PLATAFORMA" && adminOverride) {
    const loja = await prisma.loja.findUnique({ where: { id: adminOverride }, select: { nome: true } });
    nomeLojaAdmin = loja?.nome ?? null;
  }

  // Subdomínio, nome e moeda da loja do utilizador actual
  const lojaAtual = await (async () => {
    const lojaId = (session.user as { lojaId?: string }).lojaId
      ?? (role === "ADMIN_PLATAFORMA" && adminOverride ? adminOverride : null);
    if (!lojaId) return null;
    return prisma.loja.findUnique({ where: { id: lojaId }, select: { subdominio: true, nome: true, moeda: true } });
  })();

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

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="flex w-56 flex-col border-r bg-slate-900 text-white">
          <div className="px-4 py-5">
            <span className="text-lg font-bold tracking-tight">LinkCommerce</span>
          </div>
          <nav className="flex-1 space-y-1 px-2 pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Preview da loja */}
          {lojaAtual && (
            <div className="px-2 pb-3">
              <StorePreviewButton
                subdominio={lojaAtual.subdominio}
                nomeLoja={lojaAtual.nome}
              />
            </div>
          )}

          {/* Selector de idioma + moeda */}
          <div className="border-t border-slate-800 px-2 py-3">
            <DashboardLocaleSwitcher
              currentLang={currentLang}
              currentMoeda={lojaAtual?.moeda ?? "EUR"}
            />
          </div>

          <div className="border-t border-slate-800 px-4 py-4">
            <p className="truncate text-xs text-slate-400">{session.user.email}</p>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
              className="mt-2"
            >
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
