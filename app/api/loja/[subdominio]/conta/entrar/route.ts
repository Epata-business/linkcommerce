import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setClienteSession } from "@/lib/cliente-session";
import { z } from "zod";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest, { params }: { params: { subdominio: string } }) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });

  const { email, password } = parsed.data;

  const loja = await prisma.loja.findUnique({
    where: { subdominio: params.subdominio, publicada: true },
    select: { id: true },
  });
  if (!loja) return NextResponse.json({ erro: "Loja não encontrada" }, { status: 404 });

  const cliente = await prisma.cliente.findUnique({
    where: { lojaId_email: { lojaId: loja.id, email } },
  });

  // Mensagem genérica para não revelar se o email existe
  if (!cliente || !cliente.passwordHash) {
    return NextResponse.json({ erro: "Email ou password incorretos." }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, cliente.passwordHash);
  if (!ok) return NextResponse.json({ erro: "Email ou password incorretos." }, { status: 401 });

  await setClienteSession({ clienteId: cliente.id, lojaId: loja.id, email, nome: cliente.nome ?? null });
  return NextResponse.json({ ok: true });
}
