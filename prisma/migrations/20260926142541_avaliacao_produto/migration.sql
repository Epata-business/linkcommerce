-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "pedidoId" TEXT,
    "clienteEmail" TEXT NOT NULL,
    "clienteNome" TEXT,
    "estrelas" INTEGER NOT NULL,
    "comentario" TEXT,
    "aprovada" BOOLEAN NOT NULL DEFAULT false,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "avaliacoes_lojaId_produtoId_aprovada_idx" ON "avaliacoes"("lojaId", "produtoId", "aprovada");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_pedidoId_produtoId_key" ON "avaliacoes"("pedidoId", "produtoId");

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
