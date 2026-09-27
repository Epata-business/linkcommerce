-- CreateTable
CREATE TABLE "push_subscricoes" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscricoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "push_subscricoes_lojaId_idx" ON "push_subscricoes"("lojaId");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscricoes_userId_endpoint_key" ON "push_subscricoes"("userId", "endpoint");

-- AddForeignKey
ALTER TABLE "push_subscricoes" ADD CONSTRAINT "push_subscricoes_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
