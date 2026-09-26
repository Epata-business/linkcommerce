-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RoleUtilizador" ADD VALUE 'GESTOR';
ALTER TYPE "RoleUtilizador" ADD VALUE 'OPERADOR';
ALTER TYPE "RoleUtilizador" ADD VALUE 'MARKETING';
ALTER TYPE "RoleUtilizador" ADD VALUE 'FINANCEIRO';
