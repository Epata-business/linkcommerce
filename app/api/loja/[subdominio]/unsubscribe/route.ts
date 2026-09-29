import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { subdominio: string } },
) {
  let email: string;
  try {
    const body = await req.json();
    email = (typeof body.email === "string" ? body.email : "").toLowerCase().trim();
  } catch {
    return NextResponse.json({ erro: "Body inválido" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ erro: "Email inválido" }, { status: 400 });
  }

  const loja = await prisma.loja.findUnique({
    where: { subdominio: params.subdominio },
    select: { id: true },
  });
  if (!loja) return NextResponse.json({ erro: "Loja não encontrada" }, { status: 404 });

  // Upsert: se o cliente não existe, cria com opt-out; se existe, actualiza
  await prisma.cliente.upsert({
    where: { lojaId_email: { lojaId: loja.id, email } },
    update: { marketingOptOut: true },
    create: { lojaId: loja.id, email, marketingOptOut: true },
  });

  return NextResponse.json({ ok: true });
}
