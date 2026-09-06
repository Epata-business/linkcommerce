-- AlterEnum
ALTER TYPE "StatusSubscricao" ADD VALUE 'PENDENTE_TRANSFERENCIA';

-- AlterTable
ALTER TABLE "subscricoes" ADD COLUMN     "comprovanteUrl" TEXT,
ADD COLUMN     "moedaPagamento" TEXT;
