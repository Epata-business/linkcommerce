-- CreateTable
CREATE TABLE "eventos_plataforma" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "lojaId" TEXT,
    "dia" DATE NOT NULL,

    CONSTRAINT "eventos_plataforma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "eventos_plataforma_tipo_dia_idx" ON "eventos_plataforma"("tipo", "dia");
