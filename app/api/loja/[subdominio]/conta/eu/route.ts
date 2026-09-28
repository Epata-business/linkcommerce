import { NextResponse } from "next/server";
import { getClienteSession } from "@/lib/cliente-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getClienteSession();
  if (!session) return NextResponse.json({ cliente: null });

  const cliente = await prisma.cliente.findUnique({
    where: { id: session.clienteId },
    select: { id: true, email: true, nome: true, telefone: true, createdAt: true },
  });
  return NextResponse.json({ cliente });
}
