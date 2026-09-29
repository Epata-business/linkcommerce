/**
 * Script de reposição de senha do administrador.
 * Uso: node scripts/reset-admin-password.mjs NOVA_SENHA
 *
 * Requer acesso à DATABASE_URL (via .env local ou variáveis de ambiente).
 */
import { createRequire } from "module";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carrega .env manualmente sem depender do pacote dotenv
try {
  const envPath = resolve(__dirname, "../.env");
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* .env não encontrado — assume variáveis já no ambiente */ }

const require = createRequire(import.meta.url);
const bcrypt  = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const ADMIN_EMAIL = "contato.epata@gmail.com";

const novaSenha = process.argv[2];
if (!novaSenha || novaSenha.length < 8) {
  console.error("❌  Uso: node scripts/reset-admin-password.mjs NOVA_SENHA  (mínimo 8 caracteres)");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const hash = await bcrypt.hash(novaSenha, 12);
  const updated = await prisma.user.update({
    where: { email: ADMIN_EMAIL },
    data: { passwordHash: hash },
    select: { email: true, role: true },
  });
  console.log(`✅  Senha actualizada para ${updated.email} (role: ${updated.role})`);
} catch (err) {
  console.error("❌  Erro:", err.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
