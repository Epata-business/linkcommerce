import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PosClient } from "./pos-client";

export default async function PosPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const role = (session.user as { role?: string }).role;
  // OPERADOR_POS, OPERADOR, GESTOR, LOJISTA e ADMIN_PLATAFORMA podem usar o POS
  const rolesPermitidos = ["OPERADOR_POS", "OPERADOR", "GESTOR", "LOJISTA", "ADMIN_PLATAFORMA"];
  if (!role || !rolesPermitidos.includes(role)) redirect("/dashboard");

  const lojaId = (session.user as { lojaId?: string }).lojaId;
  if (!lojaId) redirect("/onboarding");

  const loja = await prisma.loja.findUnique({
    where: { id: lojaId },
    select: { moeda: true, nome: true, corPrimaria: true },
  });

  return (
    <PosClient
      lojaId={lojaId}
      moeda={loja?.moeda ?? "AOA"}
      nomeLoja={loja?.nome ?? "Loja"}
      cor={loja?.corPrimaria ?? "#153DFC"}
    />
  );
}
