import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { TEMAS } from "@/lib/temas";
import { TemasClient } from "./temas-client";

export default async function TemasPage() {
  const lojaId = await getLojaId();
  if (!lojaId) redirect("/onboarding");

  const loja = await prisma.loja.findUnique({
    where: { id: lojaId },
    select: {
      tema: true,
      subscricao: { select: { status: true } },
      plano: { select: { id: true } },
    },
  });
  if (!loja) redirect("/onboarding");

  const temPlano = loja.subscricao?.status === "ATIVA" || loja.plano != null;

  return (
    <TemasClient
      temas={TEMAS}
      temaActivo={loja.tema ?? "essencial"}
      temPlano={temPlano}
    />
  );
}
