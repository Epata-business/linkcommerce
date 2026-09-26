-- CreateEnum
CREATE TYPE "StatusReserva" AS ENUM ('ACTIVA', 'CONVERTIDA', 'LIBERADA', 'EXPIRADA');

-- AlterTable
ALTER TABLE "movimentos_stock" ADD COLUMN     "reservaId" TEXT;

-- CreateTable
CREATE TABLE "stock_reservas" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "pedidoId" TEXT,
    "produtoId" TEXT NOT NULL,
    "varianteId" TEXT,
    "quantidade" INTEGER NOT NULL,
    "status" "StatusReserva" NOT NULL DEFAULT 'ACTIVA',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvidaEm" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "stock_reservas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_reservas_lojaId_status_expiresAt_idx" ON "stock_reservas"("lojaId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "stock_reservas_pedidoId_idx" ON "stock_reservas"("pedidoId");

-- CreateIndex
CREATE INDEX "stock_reservas_lojaId_produtoId_status_idx" ON "stock_reservas"("lojaId", "produtoId", "status");

-- AddForeignKey
ALTER TABLE "stock_reservas" ADD CONSTRAINT "stock_reservas_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservas" ADD CONSTRAINT "stock_reservas_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservas" ADD CONSTRAINT "stock_reservas_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
