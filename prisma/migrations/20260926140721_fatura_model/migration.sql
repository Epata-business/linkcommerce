-- CreateEnum
CREATE TYPE "EstadoFatura" AS ENUM ('RASCUNHO', 'EMITIDA', 'PAGA', 'ANULADA');

-- CreateTable
CREATE TABLE "faturas" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "pedidoId" TEXT,
    "numero" TEXT NOT NULL,
    "estado" "EstadoFatura" NOT NULL DEFAULT 'EMITIDA',
    "dataEmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataVencimento" TIMESTAMP(3),
    "subtotal" DECIMAL(10,2) NOT NULL,
    "desconto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "iva" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'EUR',
    "clienteNome" TEXT,
    "clienteEmail" TEXT,
    "clienteNif" TEXT,
    "clienteMorada" JSONB,
    "lojaNome" TEXT,
    "lojaNif" TEXT,
    "lojaMorada" TEXT,
    "observacoes" TEXT,
    "emitidaEm" TIMESTAMP(3),
    "anuladaEm" TIMESTAMP(3),
    "emitidaPor" TEXT,

    CONSTRAINT "faturas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "faturas_pedidoId_key" ON "faturas"("pedidoId");

-- CreateIndex
CREATE INDEX "faturas_lojaId_dataEmissao_idx" ON "faturas"("lojaId", "dataEmissao" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "faturas_lojaId_numero_key" ON "faturas"("lojaId", "numero");

-- AddForeignKey
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
