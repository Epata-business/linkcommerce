import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setClienteSession } from "@/lib/cliente-session";
import { z } from "zod";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nome: z.string().min(1),
});

export async function POST(req: NextRequest, { params }: { params: { subdominio: string } }) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });

  const { email, password, nome } = parsed.data;

  const loja = await prisma.loja.findUnique({
    where: { subdominio: params.subdominio, publicada: true },
    select: { id: true },
  });
  if (!loja) return NextResponse.json({ erro: "Loja não encontrada" }, { status: 404 });

  const existente = await prisma.cliente.findUnique({
    where: { lojaId_email: { lojaId: loja.id, email } },
  });
  if (existente) {
    return NextResponse.json({ erro: "Este email já está registado nesta loja." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const cliente = await prisma.cliente.upsert({
    where: { lojaId_email: { lojaId: loja.id, email } },
    create: { lojaId: loja.id, email, nome, passwordHash },
    update: { nome, passwordHash },
  });

  await setClienteSession({ clienteId: cliente.id, lojaId: loja.id, email, nome });
  return NextResponse.json({ ok: true });
}
