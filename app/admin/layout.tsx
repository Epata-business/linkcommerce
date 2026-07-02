import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

const navLinks = [
  { href: "/admin", label: "Visão Geral" },
  { href: "/admin/lojas", label: "Lojas" },
  { href: "/admin/utilizadores", label: "Utilizadores" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  if ((session.user as { role?: string }).role !== "ADMIN_PLATAFORMA") redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r bg-slate-950 text-white">
        <div className="px-4 py-5 border-b border-slate-800">
          <span className="text-sm font-bold tracking-tight text-slate-400 uppercase">LinkCommerce</span>
          <p className="text-xs text-indigo-400 mt-0.5 font-semibold">Painel Admin</p>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className="block rounded px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-800 px-4 py-4">
          <p className="truncate text-xs text-slate-400">{session.user.email}</p>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }} className="mt-2">
            <button type="submit" className="text-xs text-slate-500 hover:text-white transition-colors">Sair →</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-slate-50">{children}</main>
    </div>
  );
}
