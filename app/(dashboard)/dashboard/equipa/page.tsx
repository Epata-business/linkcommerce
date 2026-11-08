import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { podeGerir, ROLE_LABELS, type RoleUtilizador } from "@/lib/rbac";
import { EquipaClient } from "./equipa-client";

export default async function EquipaPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  // Apenas LOJISTA e ADMIN_PLATAFORMA podem gerir equipa
  if (!podeGerir(role)) redirect("/dashboard");

  const lojaId = await getLojaId();

  const membros = await prisma.user.findMany({
    where: { lojaId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const membrosFormatados = membros.map(m => ({
    ...m,
    roleLabel: ROLE_LABELS[m.role as RoleUtilizador] ?? m.role,
  }));

  return (
    <div className="min-h-screen" style={{ background: "#F7F8FC" }}>
      <div className="max-w-3xl mx-auto px-5 py-7">
        <div className="mb-6">
          <h1 className="heading-lg">Equipa</h1>
          <p className="body-sm mt-0.5">
            {membros.length} membro{membros.length !== 1 ? "s" : ""} com acesso à loja
          </p>
        </div>

        <EquipaClient membros={membrosFormatados} />
      </div>
    </div>
  );
}
