import { getLojaId } from "@/lib/get-loja-id";
import { prisma } from "@/lib/prisma";
import { PosClient } from "./pos-client";

export default async function PosPage() {
  const lojaId = await getLojaId();
  const loja = await prisma.loja.findUnique({ where: { id: lojaId }, select: { moeda: true } });
  return <PosClient moeda={loja?.moeda ?? "EUR"} />;
}
