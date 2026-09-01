-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "zonaEntregaId" TEXT;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_zonaEntregaId_fkey" FOREIGN KEY ("zonaEntregaId") REFERENCES "zonas_entrega"("id") ON DELETE SET NULL ON UPDATE CASCADE;
