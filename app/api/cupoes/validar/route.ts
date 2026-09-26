import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/cupoes/validar
// Body: { codigo: string, subdominio: string, subtotal: number }
// Retorna: { valido, desconto, tipo, valor, cupaoId } ou { erro }
export async function POST(req: NextRequest) {
  const { codigo, subdominio, subtotal } = await req.json();

  if (!codigo || !subdominio || typeof subtotal !== "number") {
    return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });
  }

  const loja = await prisma.loja.findUnique({
    where: { subdominio },
    select: { id: true },
  });
  if (!loja) return NextResponse.json({ erro: "Loja não encontrada" }, { status: 404 });

  const cupao = await prisma.cupao.findUnique({
    where: { lojaId_codigo: { lojaId: loja.id, codigo: codigo.toUpperCase() } },
  });

  if (!cupao) return NextResponse.json({ erro: "Cupão inválido" }, { status: 404 });
  if (!cupao.ativo) return NextResponse.json({ erro: "Cupão inativo" }, { status: 400 });
  if (cupao.validade && cupao.validade < new Date()) {
    return NextResponse.json({ erro: "Cupão expirado" }, { status: 400 });
  }
  if (cupao.usosMaximos !== null && cupao.usosAtuais >= cupao.usosMaximos) {
    return NextResponse.json({ erro: "Cupão esgotado" }, { status: 400 });
  }

  const valorCupao = Number(cupao.valor);
  const desconto = cupao.tipo === "PERCENTAGEM"
    ? Math.round((subtotal * valorCupao / 100) * 100) / 100
    : Math.min(valorCupao, subtotal);

  return NextResponse.json({
    valido: true,
    cupaoId: cupao.id,
    codigo: cupao.codigo,
    tipo: cupao.tipo,
    valor: valorCupao,
    desconto,
  });
}
