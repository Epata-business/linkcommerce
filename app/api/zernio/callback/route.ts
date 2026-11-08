import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { listarContas } from "@/lib/zernio";

// POST /api/zernio/callback
// Called by the dashboard after the OAuth popup closes successfully
// Body: { profileId, platform }
// Fetches the newly connected account from Zernio and saves it locally
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const lojaId = await getLojaId();

  const { profileId, platform } = await req.json();
  if (!profileId || !platform) {
    return NextResponse.json({ erro: "Dados em falta" }, { status: 400 });
  }

  // Fetch accounts for this profile from Zernio to find the newly added one
  const contas = await listarContas(profileId);
  const conta = contas.find((c) => c.platform === platform);
  if (!conta) {
    return NextResponse.json({ erro: "Conta não encontrada no Zernio" }, { status: 404 });
  }

  // Upsert in our DB
  await prisma.contaSocial.upsert({
    where: { lojaId_accountId: { lojaId, accountId: conta._id } },
    create: {
      lojaId,
      plataforma: conta.platform,
      nomeExibido: conta.name,
      accountId: conta._id,
      profileId,
      ativa: true,
    },
    update: {
      nomeExibido: conta.name,
      ativa: true,
    },
  });

  return NextResponse.json({ ok: true, conta: { platform: conta.platform, name: conta.name } });
}
