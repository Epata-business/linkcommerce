-- CreateEnum
CREATE TYPE "TipoMovimentoStock" AS ENUM ('RESERVA', 'RESERVA_EXPIRADA', 'VENDA', 'CANCELAMENTO', 'REPOSICAO', 'AJUSTE', 'DEVOLUCAO');

-- AlterEnum
ALTER TYPE "StatusPedido" ADD VALUE 'RETURNED';

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "permitirOverselling" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stockMinimo" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stockReservado" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "variantes" ADD COLUMN     "stockReservado" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "movimentos_stock" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "varianteId" TEXT,
    "tipo" "TipoMovimentoStock" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "pedidoId" TEXT,
    "nota" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movimentos_stock_lojaId_produtoId_idx" ON "movimentos_stock"("lojaId", "produtoId");

-- CreateIndex
CREATE INDEX "movimentos_stock_pedidoId_idx" ON "movimentos_stock"("pedidoId");

-- CreateIndex
CREATE INDEX "produtos_lojaId_stock_idx" ON "produtos"("lojaId", "stock");

-- AddForeignKey
ALTER TABLE "movimentos_stock" ADD CONSTRAINT "movimentos_stock_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_stock" ADD CONSTRAINT "movimentos_stock_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
