-- AlterTable
ALTER TABLE "lojas" ADD COLUMN     "telefoneWA" TEXT;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "comprovanteUrl" TEXT;

-- CreateTable
CREATE TABLE "zonas_entrega" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "prazo" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "zonas_entrega_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "zonas_entrega" ADD CONSTRAINT "zonas_entrega_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
