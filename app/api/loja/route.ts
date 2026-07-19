import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { email: emailBody, nome, subdominio, tipoNegocio, corPrimaria, corSecundaria } = body;

  if (!nome || !subdominio) {
    return NextResponse.json({ erro: "dados-invalidos" }, { status: 400 });
  }

  const subdominioLimpo = subdominio.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  const existe = await prisma.loja.findUnique({ where: { subdominio: subdominioLimpo } });
  if (existe) {
    return NextResponse.json({ erro: "subdominio-em-uso" }, { status: 409 });
  }

  // Utilizador pode vir da sessão (já autenticado) ou do email (registo novo)
  const session = await auth();
  const emailFinal = session?.user?.email ?? emailBody;

  if (!emailFinal) {
    return NextResponse.json({ erro: "nao-autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: emailFinal } });
  if (!user) {
    return NextResponse.json({ erro: "utilizador-nao-encontrado" }, { status: 404 });
  }

  const planoFree = await prisma.plano.findFirst({ where: { slug: "free" } });

  // Moeda padrão com base no idioma escolhido pelo utilizador
  const VALID_CURRENCIES = ["EUR", "USD", "AOA"];
  const cookieCur = cookies().get("CUR")?.value ?? "";
  const moedaPadrao = VALID_CURRENCIES.includes(cookieCur) ? cookieCur : "EUR";

  const loja = await prisma.loja.create({
    data: {
      nome,
      subdominio: subdominioLimpo,
      planoId: planoFree?.id,
      tipoNegocio: tipoNegocio ?? null,
      corPrimaria: corPrimaria ?? "#0F172A",
      corSecundaria: corSecundaria ?? "#6366f1",
      moeda: moedaPadrao,
    },
  });

  await prisma.user.update({
    where: { email: emailFinal },
    data: { lojaId: loja.id },
  });

  return NextResponse.json({ ok: true, lojaId: loja.id });
}
