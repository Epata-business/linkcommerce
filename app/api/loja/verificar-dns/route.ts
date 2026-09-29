/**
 * GET /api/loja/verificar-dns?dominio=loja.meusite.ao
 * Verifica se o CNAME do domínio aponta para o destino correcto.
 * Usa resolução DNS pública via Google DoH (DNS-over-HTTPS).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";

const DESTINO_CNAME = "cname.vercel-dns.com";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const dominio = req.nextUrl.searchParams.get("dominio");
  if (!dominio) return NextResponse.json({ erro: "Domínio obrigatório" }, { status: 400 });

  // Confirmar que o domínio pertence à loja do utilizador
  const lojaId = await getLojaId();
  const loja = await prisma.loja.findUnique({ where: { id: lojaId }, select: { dominioProprio: true } });
  if (loja?.dominioProprio !== dominio) {
    return NextResponse.json({ erro: "Domínio não corresponde à loja." }, { status: 403 });
  }

  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(dominio)}&type=CNAME`,
      { headers: { Accept: "application/dns-json" }, next: { revalidate: 0 } },
    );
    const data = await res.json() as { Status: number; Answer?: { type: number; data: string }[] };

    const cnameRecords = (data.Answer ?? []).filter(r => r.type === 5); // type 5 = CNAME
    const propagado = cnameRecords.some(r => r.data.replace(/\.$/, "") === DESTINO_CNAME);

    return NextResponse.json({ propagado, cnameRecords: cnameRecords.map(r => r.data) });
  } catch {
    return NextResponse.json({ propagado: false, erro: "Não foi possível verificar o DNS." });
  }
}
