import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function criarPrismaClient(): PrismaClient {
  const emBuild = process.env.NEXT_PHASE === "phase-production-build";
  const emProducao = process.env.NODE_ENV === "production" && !emBuild;

  if (emProducao && process.env.DATABASE_URL) {
    // Em runtime de produção (Vercel serverless): usa adaptador HTTP do Neon
    // para evitar limite de conexões TCP em ambiente serverless.
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaNeonHttp } = require("@prisma/adapter-neon");
      const adapter = new PrismaNeonHttp(process.env.DATABASE_URL, {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new PrismaClient({ adapter } as any);
    } catch {
      // fallback para cliente padrão se o adaptador falhar
    }
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? criarPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
