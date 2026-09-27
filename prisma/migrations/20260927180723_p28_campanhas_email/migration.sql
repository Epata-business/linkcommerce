-- CreateEnum
CREATE TYPE "StatusCampanha" AS ENUM ('RASCUNHO', 'ENVIANDO', 'ENVIADA', 'FALHADA');

-- CreateTable
CREATE TABLE "campanhas" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "status" "StatusCampanha" NOT NULL DEFAULT 'RASCUNHO',
    "totalEnviados" INTEGER NOT NULL DEFAULT 0,
    "totalFalhados" INTEGER NOT NULL DEFAULT 0,
    "enviadaEm" TIMESTAMP(3),
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campanhas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campanhas_lojaId_status_idx" ON "campanhas"("lojaId", "status");

-- AddForeignKey
ALTER TABLE "campanhas" ADD CONSTRAINT "campanhas_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
