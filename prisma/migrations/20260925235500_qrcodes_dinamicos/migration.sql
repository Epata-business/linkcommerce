-- CreateTable
CREATE TABLE "qrcodes" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qrcodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_scans" (
    "id" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "dia" DATE NOT NULL,

    CONSTRAINT "qr_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "qrcodes_slug_key" ON "qrcodes"("slug");

-- CreateIndex
CREATE INDEX "qrcodes_lojaId_idx" ON "qrcodes"("lojaId");

-- CreateIndex
CREATE INDEX "qr_scans_qrCodeId_dia_idx" ON "qr_scans"("qrCodeId", "dia");

-- AddForeignKey
ALTER TABLE "qrcodes" ADD CONSTRAINT "qrcodes_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_scans" ADD CONSTRAINT "qr_scans_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "qrcodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
