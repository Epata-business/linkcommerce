import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;

  const qr = await prisma.qrCode.findUnique({
    where: { slug },
    select: { id: true, destino: true, ativo: true },
  });

  if (!qr || !qr.ativo) {
    return NextResponse.redirect(new URL("/", _req.url));
  }

  // Registar scan: apenas a data (sem IP, user-agent, sessão ou qualquer dado pessoal)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  void prisma.qrScan.create({
    data: { qrCodeId: qr.id, dia: hoje },
  });

  return NextResponse.redirect(qr.destino);
}
