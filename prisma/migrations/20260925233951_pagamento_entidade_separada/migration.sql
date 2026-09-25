/*
  Warnings:

  - You are about to drop the column `comprovanteUrl` on the `pedidos` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('CARTAO', 'MBWAY', 'MULTIBANCO', 'PAYPAL', 'MULTICAIXA', 'NA_ENTREGA', 'TRANSFERENCIA', 'DESCONHECIDO');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'CONFIRMADO', 'FALHADO', 'EXPIRADO', 'REEMBOLSADO', 'CANCELADO');

-- AlterTable
ALTER TABLE "pedidos" DROP COLUMN "comprovanteUrl";

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "metodo" "MetodoPagamento" NOT NULL DEFAULT 'DESCONHECIDO',
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "valor" DECIMAL(10,2) NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'AOA',
    "referencia" TEXT,
    "provedor" TEXT,
    "comprovanteUrl" TEXT,
    "eventoId" TEXT,
    "metadata" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_eventoId_key" ON "pagamentos"("eventoId");

-- CreateIndex
CREATE INDEX "pagamentos_lojaId_idx" ON "pagamentos"("lojaId");

-- CreateIndex
CREATE INDEX "pagamentos_pedidoId_idx" ON "pagamentos"("pedidoId");

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
