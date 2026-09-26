-- CreateEnum
CREATE TYPE "StatusCarrinho" AS ENUM ('ABANDONADO', 'CONVERTIDO', 'EMAIL_ENVIADO', 'RECUPERADO');

-- CreateTable
CREATE TABLE "carrinhos_abandonados" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "clienteEmail" TEXT NOT NULL,
    "clienteNome" TEXT,
    "itens" JSONB NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'AOA',
    "status" "StatusCarrinho" NOT NULL DEFAULT 'ABANDONADO',
    "emailEnviadoEm" TIMESTAMP(3),
    "recuperadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carrinhos_abandonados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "carrinhos_abandonados_lojaId_status_criadoEm_idx" ON "carrinhos_abandonados"("lojaId", "status", "criadoEm");

-- CreateIndex
CREATE INDEX "carrinhos_abandonados_lojaId_clienteEmail_idx" ON "carrinhos_abandonados"("lojaId", "clienteEmail");

-- AddForeignKey
ALTER TABLE "carrinhos_abandonados" ADD CONSTRAINT "carrinhos_abandonados_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
