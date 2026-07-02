-- CreateEnum
CREATE TYPE "CicloFaturacao" AS ENUM ('MENSAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "StatusSubscricao" AS ENUM ('TRIAL', 'ATIVA', 'EM_FALTA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "RoleUtilizador" AS ENUM ('ADMIN_PLATAFORMA', 'LOJISTA', 'OPERADOR_POS');

-- CreateEnum
CREATE TYPE "ProvedorPagamento" AS ENUM ('STRIPE', 'MBWAY', 'MULTICAIXA');

-- CreateEnum
CREATE TYPE "TipoEnvio" AS ENUM ('TAXA_FIXA', 'POR_PESO', 'RECOLHA_NA_LOJA');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CanalPedido" AS ENUM ('ONLINE', 'POS');

-- CreateEnum
CREATE TYPE "TipoCupao" AS ENUM ('PERCENTAGEM', 'VALOR_FIXO');

-- CreateTable
CREATE TABLE "planos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "precoMensal" DECIMAL(10,2) NOT NULL,
    "comissaoPercentual" DECIMAL(5,2) NOT NULL,
    "limiteProdutos" INTEGER,
    "permiteDominioProprio" BOOLEAN NOT NULL DEFAULT false,
    "permiteApiAccess" BOOLEAN NOT NULL DEFAULT false,
    "permiteWhiteLabel" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscricoes" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "status" "StatusSubscricao" NOT NULL DEFAULT 'TRIAL',
    "cicloFaturacao" "CicloFaturacao" NOT NULL DEFAULT 'MENSAL',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "trialFimEm" TIMESTAMP(3),
    "proximaCobranca" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscricoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "RoleUtilizador" NOT NULL DEFAULT 'LOJISTA',
    "lojaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "lojas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "subdominio" TEXT NOT NULL,
    "dominioProprio" TEXT,
    "corPrimaria" TEXT NOT NULL DEFAULT '#0F172A',
    "corSecundaria" TEXT NOT NULL DEFAULT '#3B82F6',
    "logotipoUrl" TEXT,
    "tipoNegocio" TEXT,
    "templateBase" TEXT NOT NULL DEFAULT 'produtos_fisicos',
    "publicada" BOOLEAN NOT NULL DEFAULT true,
    "planoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lojas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metodos_pagamento_loja" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "provedor" "ProvedorPagamento" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "configJson" JSONB,

    CONSTRAINT "metodos_pagamento_loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metodos_envio" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoEnvio" NOT NULL,
    "valorBase" DECIMAL(10,2) NOT NULL,
    "valorPorKg" DECIMAL(10,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "metodos_envio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DECIMAL(10,2) NOT NULL,
    "sku" TEXT,
    "imagemUrl" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variantes" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "nomeOpcao" TEXT NOT NULL,
    "sku" TEXT,
    "precoExtra" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "variantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT,
    "telefone" TEXT,
    "morada" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "clienteId" TEXT,
    "clienteEmail" TEXT NOT NULL,
    "clienteNome" TEXT,
    "morada" JSONB,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "desconto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "status" "StatusPedido" NOT NULL DEFAULT 'PENDING',
    "channel" "CanalPedido" NOT NULL DEFAULT 'ONLINE',
    "clientUuid" TEXT,
    "sincronizadoEm" TIMESTAMP(3),
    "cupaoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "varianteId" TEXT,
    "quantidade" INTEGER NOT NULL,
    "precoUnitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cupoes" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoCupao" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "validade" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "usosMaximos" INTEGER,
    "usosAtuais" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cupoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "planos_nome_key" ON "planos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "planos_slug_key" ON "planos"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subscricoes_lojaId_key" ON "subscricoes"("lojaId");

-- CreateIndex
CREATE UNIQUE INDEX "subscricoes_stripeCustomerId_key" ON "subscricoes"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscricoes_stripeSubscriptionId_key" ON "subscricoes"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "lojas_subdominio_key" ON "lojas"("subdominio");

-- CreateIndex
CREATE UNIQUE INDEX "lojas_dominioProprio_key" ON "lojas"("dominioProprio");

-- CreateIndex
CREATE UNIQUE INDEX "metodos_pagamento_loja_lojaId_provedor_key" ON "metodos_pagamento_loja"("lojaId", "provedor");

-- CreateIndex
CREATE INDEX "produtos_lojaId_idx" ON "produtos"("lojaId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_lojaId_email_key" ON "clientes"("lojaId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_clientUuid_key" ON "pedidos"("clientUuid");

-- CreateIndex
CREATE INDEX "pedidos_lojaId_status_idx" ON "pedidos"("lojaId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "cupoes_lojaId_codigo_key" ON "cupoes"("lojaId", "codigo");

-- AddForeignKey
ALTER TABLE "subscricoes" ADD CONSTRAINT "subscricoes_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscricoes" ADD CONSTRAINT "subscricoes_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "planos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lojas" ADD CONSTRAINT "lojas_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "planos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metodos_pagamento_loja" ADD CONSTRAINT "metodos_pagamento_loja_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metodos_envio" ADD CONSTRAINT "metodos_envio_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes" ADD CONSTRAINT "variantes_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cupaoId_fkey" FOREIGN KEY ("cupaoId") REFERENCES "cupoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "variantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cupoes" ADD CONSTRAINT "cupoes_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
