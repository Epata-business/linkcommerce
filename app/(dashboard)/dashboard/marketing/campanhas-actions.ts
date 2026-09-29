"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getLojaId } from "@/lib/get-loja-id";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");

export async function criarCampanha(formData: FormData) {
  const lojaId = await getLojaId();
  const nome = (formData.get("nome") as string)?.trim();
  const assunto = (formData.get("assunto") as string)?.trim();
  const corpo = (formData.get("corpo") as string)?.trim();
  if (!nome || !assunto || !corpo) return { erro: "Campos obrigatórios em falta." };

  await prisma.campanha.create({ data: { lojaId, nome, assunto, corpo } });
  revalidatePath("/dashboard/marketing");
}

export async function eliminarCampanha(id: string) {
  const lojaId = await getLojaId();
  const camp = await prisma.campanha.findFirst({ where: { id, lojaId } });
  if (!camp || camp.status === "ENVIANDO") return;
  await prisma.campanha.delete({ where: { id } });
  revalidatePath("/dashboard/marketing");
}

export async function enviarCampanha(id: string) {
  const lojaId = await getLojaId();
  const session = await auth();

  const [camp, loja] = await Promise.all([
    prisma.campanha.findFirst({ where: { id, lojaId } }),
    prisma.loja.findUnique({ where: { id: lojaId }, select: { nome: true, subdominio: true } }),
  ]);
  if (!camp || camp.status !== "RASCUNHO") return { erro: "Campanha não encontrada ou já enviada." };
  if (!loja) return { erro: "Loja não encontrada." };

  // Buscar clientes que não fizeram opt-out de marketing
  const clientes = await prisma.cliente.findMany({
    where: { lojaId, marketingOptOut: false },
    select: { email: true, nome: true },
  });
  if (clientes.length === 0) return { erro: "Nenhum cliente com email registado (ou todos fizeram opt-out)." };

  // Marcar como ENVIANDO
  await prisma.campanha.update({ where: { id }, data: { status: "ENVIANDO" } });

  let enviados = 0;
  let falhados = 0;

  // Enviar em lotes de 50 (limite Resend batch)
  const lote = 50;
  for (let i = 0; i < clientes.length; i += lote) {
    const batch = clientes.slice(i, i + lote);
    const results = await Promise.allSettled(
      batch.map(c =>
        resend.emails.send({
          from: `${loja.nome} <noreply@linkcommerce.ao>`,
          to: c.email,
          subject: camp.assunto,
          html: camp.corpo,
          headers: {
            "List-Unsubscribe": `<https://${loja.subdominio}.linkcommerce.cc/unsubscribe?email=${encodeURIComponent(c.email)}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        })
      )
    );
    for (const r of results) {
      if (r.status === "fulfilled") enviados++;
      else falhados++;
    }
  }

  await prisma.campanha.update({
    where: { id },
    data: { status: "ENVIADA", totalEnviados: enviados, totalFalhados: falhados, enviadaEm: new Date() },
  });

  revalidatePath("/dashboard/marketing");
  return { ok: true, enviados, falhados };
}
