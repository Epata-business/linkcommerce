import { PrismaClient } from "@prisma/client";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaNeonHttp } = require("@prisma/adapter-neon");

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function criarPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new PrismaClient({ adapter } as any);
  }
  return new PrismaClient({
    log: ["query", "error", "warn"],
  });
}

export const prisma = globalForPrisma.prisma ?? criarPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
