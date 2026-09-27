import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export function gerarApiKey(): { chave: string; hash: string; prefixo: string } {
  const raw = randomBytes(32).toString("hex");
  const chave = `lc_${raw}`;
  const hash = createHash("sha256").update(chave).digest("hex");
  const prefixo = chave.slice(0, 10); // "lc_" + 7 chars
  return { chave, hash, prefixo };
}

export async function autenticarApiKey(
  authHeader: string | null,
): Promise<{ lojaId: string } | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const chave = authHeader.slice(7).trim();
  if (!chave.startsWith("lc_")) return null;

  const hash = createHash("sha256").update(chave).digest("hex");
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    select: { id: true, lojaId: true, ativa: true },
  });

  if (!apiKey || !apiKey.ativa) return null;

  // Actualizar ultimoUso sem bloquear
  void prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { ultimoUso: new Date() },
  });

  return { lojaId: apiKey.lojaId };
}
