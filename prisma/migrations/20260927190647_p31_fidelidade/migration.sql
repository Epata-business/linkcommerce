-- CreateEnum
CREATE TYPE "TipoMovimentoPontos" AS ENUM ('GANHO', 'RESGATE', 'AJUSTE', 'EXPIRACAO');

-- CreateTable
CREATE TABLE "config_fidelidade" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "pontosPorUnidade" DECIMAL(8,2) NOT NULL DEFAULT 1,
    "valorPorPonto" DECIMAL(8,4) NOT NULL DEFAULT 0.01,
    "pontosMinResgatar" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "config_fidelidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pontos_fidelidade" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "clienteEmail" TEXT NOT NULL,
    "clienteNome" TEXT,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "totalGanho" INTEGER NOT NULL DEFAULT 0,
    "totalGasto" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pontos_fidelidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_pontos" (
    "id" TEXT NOT NULL,
    "saldoId" TEXT NOT NULL,
    "tipo" "TipoMovimentoPontos" NOT NULL,
    "pontos" INTEGER NOT NULL,
    "pedidoId" TEXT,
    "nota" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_pontos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "config_fidelidade_lojaId_key" ON "config_fidelidade"("lojaId");

-- CreateIndex
CREATE INDEX "pontos_fidelidade_lojaId_idx" ON "pontos_fidelidade"("lojaId");

-- CreateIndex
CREATE UNIQUE INDEX "pontos_fidelidade_lojaId_clienteEmail_key" ON "pontos_fidelidade"("lojaId", "clienteEmail");

-- CreateIndex
CREATE INDEX "movimentos_pontos_saldoId_idx" ON "movimentos_pontos"("saldoId");

-- AddForeignKey
ALTER TABLE "config_fidelidade" ADD CONSTRAINT "config_fidelidade_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pontos_fidelidade" ADD CONSTRAINT "pontos_fidelidade_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_pontos" ADD CONSTRAINT "movimentos_pontos_saldoId_fkey" FOREIGN KEY ("saldoId") REFERENCES "pontos_fidelidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
