import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/ui/back-button";
import { PerfilForm } from "./perfil-form";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/entrar");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { name: true, email: true, image: true, passwordHash: true, createdAt: true, accounts: { select: { provider: true } } },
  });

  if (!user) redirect("/entrar");

  const provedores = user.accounts.map(a => a.provider);

  return (
    <div className="p-6 max-w-lg">
      <BackButton href="/dashboard/configuracoes" label="← Configurações" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">O meu perfil</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Membro desde {new Date(user.createdAt).toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}
          </p>
        </div>
        {provedores.length > 0 && (
          <div className="flex gap-1.5">
            {provedores.map(p => (
              <span key={p} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 capitalize">
                {p}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <PerfilForm
          nome={user.name}
          email={user.email!}
          image={user.image}
          temSenha={!!user.passwordHash}
        />
      </div>
    </div>
  );
}
