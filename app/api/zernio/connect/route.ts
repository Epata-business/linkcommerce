import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { criarPerfilZernio, obterUrlConexao } from "@/lib/zernio";
import { checkRateLimit } from "@/lib/rate-limit";

const PLATAFORMAS_PERMITIDAS = [
  "linkedin", "instagram", "facebook", "twitter", "tiktok", "youtube",
];

// GET /api/zernio/connect?platform=instagram
// Devolve a URL OAuth para ligar a conta social da loja
export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, { prefix: "zernio-connect", limit: 10, windowSec: 3600 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const platform = req.nextUrl.searchParams.get("platform");
  if (!platform || !PLATAFORMAS_PERMITIDAS.includes(platform)) {
    return NextResponse.json({ erro: "Plataforma inválida" }, { status: 400 });
  }

  const lojaId = await getLojaId();
  const loja = await prisma.loja.findUnique({ where: { id: lojaId }, select: { nome: true } });
  if (!loja) return NextResponse.json({ erro: "Loja não encontrada" }, { status: 404 });

  // Find or create a Zernio profile for this store
  // Profile ID is stored as a setting — we use a simple approach: check if any account exists
  const contaExistente = await prisma.contaSocial.findFirst({
    where: { lojaId },
    select: { profileId: true },
  });

  let profileId = contaExistente?.profileId;
  if (!profileId) {
    const perfil = await criarPerfilZernio(loja.nome);
    profileId = perfil._id;
  }

  const { authUrl } = await obterUrlConexao(platform, profileId);

  return NextResponse.json({ authUrl, profileId });
}
