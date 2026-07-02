"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function verificarAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN_PLATAFORMA") throw new Error("Não autorizado");
}

export async function removerLoja(lojaId: string) {
  await verificarAdmin();
  await prisma.loja.delete({ where: { id: lojaId } });
  revalidatePath("/admin/lojas");
}

export async function togglePublicada(lojaId: string, publicada: boolean) {
  await verificarAdmin();
  await prisma.loja.update({ where: { id: lojaId }, data: { publicada } });
  revalidatePath("/admin/lojas");
}
