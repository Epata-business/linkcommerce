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
    <div className="min-h-screen" style={{ background: "#F7F8FC" }}>
    <div className="max-w-lg mx-auto px-5 py-7">
      <BackButton href="/dashboard/configuracoes" label="← Configurações" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-lg">O meu perfil</h1>
          <p className="body-sm mt-0.5">
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

      <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid hsl(220 20% 91%)", boxShadow: "0 1px 3px rgba(15,17,23,0.04)" }}>
        <PerfilForm
          nome={user.name}
          email={user.email!}
          image={user.image}
          temSenha={!!user.passwordHash}
        />
      </div>
    </div>
    </div>
  );
}
