-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "valoresAntigos" JSONB,
    "valoresNovos" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_lojaId_criadoEm_idx" ON "audit_logs"("lojaId", "criadoEm" DESC);

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
