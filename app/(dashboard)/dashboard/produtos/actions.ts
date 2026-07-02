"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// -----------------------------------------------------------------------------
// app/(dashboard)/dashboard/produtos/actions.ts
// CRUD de produtos via Server Actions (sem necessidade de criar /api/produtos
// no cliente — usado directamente pelos formulários de app/.../produtos/page.tsx).
// O endpoint /api/produtos (route handler) é mantido em paralelo para
// integrações externas / app POS, ver app/api/produtos/route.ts.
// -----------------------------------------------------------------------------

const produtoSchema = z.object({
  titulo: z.string().min(2, "Título demasiado curto"),
  descricao: z.string().optional(),
  preco: z.coerce.number().positive("Preço deve ser positivo"),
  sku: z.string().optional(),
  stock: z.coerce.number().int().nonnegative(),
  imagemUrl: z.string().url().optional().or(z.literal("")),
});

async function getLojaIdDoUtilizadorAtual() {
  const session = await auth();
  if (!session?.user?.lojaId) {
    throw new Error("Utilizador não tem loja associada.");
  }
  return session.user.lojaId as string;
}

export async function criarProduto(formData: FormData) {
  const lojaId = await getLojaIdDoUtilizadorAtual();

  const dados = produtoSchema.parse({
    titulo: formData.get("titulo"),
    descricao: formData.get("descricao"),
    preco: formData.get("preco"),
    sku: formData.get("sku"),
    stock: formData.get("stock"),
    imagemUrl: formData.get("imagemUrl"),
  });

  await prisma.produto.create({
    data: { ...dados, lojaId },
  });

  revalidatePath("/dashboard/produtos");
}

export async function atualizarProduto(produtoId: string, formData: FormData) {
  const lojaId = await getLojaIdDoUtilizadorAtual();

  const dados = produtoSchema.parse({
    titulo: formData.get("titulo"),
    descricao: formData.get("descricao"),
    preco: formData.get("preco"),
    sku: formData.get("sku"),
    stock: formData.get("stock"),
    imagemUrl: formData.get("imagemUrl"),
  });

  // garante que o produto pertence à loja do utilizador autenticado
  await prisma.produto.updateMany({
    where: { id: produtoId, lojaId },
    data: dados,
  });

  revalidatePath("/dashboard/produtos");
}

export async function removerProduto(produtoId: string) {
  const lojaId = await getLojaIdDoUtilizadorAtual();
  await prisma.produto.deleteMany({ where: { id: produtoId, lojaId } });
  revalidatePath("/dashboard/produtos");
}

// ── Variantes ────────────────────────────────────────────────────────────────

const varianteSchema = z.object({
  nomeOpcao: z.string().min(1),
  precoExtra: z.coerce.number().nonnegative().default(0),
  stock: z.coerce.number().int().nonnegative().default(0),
  sku: z.string().optional(),
});

export async function criarVariante(produtoId: string, formData: FormData) {
  const lojaId = await getLojaIdDoUtilizadorAtual();
  // garantir que o produto pertence à loja
  const produto = await prisma.produto.findFirst({ where: { id: produtoId, lojaId } });
  if (!produto) throw new Error("Produto não encontrado.");

  const dados = varianteSchema.parse({
    nomeOpcao: formData.get("nomeOpcao"),
    precoExtra: formData.get("precoExtra"),
    stock: formData.get("stock"),
    sku: formData.get("sku"),
  });

  await prisma.variante.create({ data: { produtoId, ...dados } });
  revalidatePath("/dashboard/produtos");
}

export async function atualizarVariante(varianteId: string, formData: FormData) {
  const lojaId = await getLojaIdDoUtilizadorAtual();
  const dados = varianteSchema.parse({
    nomeOpcao: formData.get("nomeOpcao"),
    precoExtra: formData.get("precoExtra"),
    stock: formData.get("stock"),
    sku: formData.get("sku"),
  });
  await prisma.variante.updateMany({
    where: { id: varianteId, produto: { lojaId } },
    data: dados,
  });
  revalidatePath("/dashboard/produtos");
}

export async function removerVariante(varianteId: string) {
  const lojaId = await getLojaIdDoUtilizadorAtual();
  await prisma.variante.deleteMany({
    where: { id: varianteId, produto: { lojaId } },
  });
  revalidatePath("/dashboard/produtos");
}

async function chamarClaude(prompt: string, maxTokens = 300): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY não configurada");
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  const bloco = msg.content.find((b) => b.type === "text");
  return bloco?.type === "text" ? bloco.text.trim() : "";
}

export async function gerarDescricaoComIA(titulo: string) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY não configurada. Adicione-a ao ficheiro .env");
  }

  return chamarClaude(
    `Escreve uma descrição de produto profissional, apelativa e concisa (máx. 60 palavras) para um produto de e-commerce chamado "${titulo}". Responde apenas com a descrição, sem comentários adicionais.`
  );
}

export async function gerarTituloComIA(tituloAtual: string): Promise<string> {
  return chamarClaude(
    `Melhora este título de produto para e-commerce tornando-o mais apelativo e profissional: "${tituloAtual}". Responde apenas com o novo título, sem aspas nem comentários adicionais.`,
    100
  );
}

export async function sugerirPrecoComIA(titulo: string, descricao: string): Promise<string> {
  const texto = await chamarClaude(
    `Com base no nome "${titulo}" e descrição "${descricao}", sugere um preço de venda em euros (€) para e-commerce. Responde APENAS com o número sem símbolo de moeda, exemplo: 29.99`,
    50
  );
  const num = parseFloat(texto.replace(",", ".").replace(/[^0-9.]/g, ""));
  return isNaN(num) ? "" : num.toFixed(2);
}
