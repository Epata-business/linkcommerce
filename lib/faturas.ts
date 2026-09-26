import { prisma } from "@/lib/prisma";

// Gera o próximo número de fatura sequencial para a loja: ex. LC-2025-0001
async function gerarNumeroFatura(lojaId: string, ano: number): Promise<string> {
  const prefixo = `LC-${ano}-`;
  const ultima = await prisma.fatura.findFirst({
    where: { lojaId, numero: { startsWith: prefixo } },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });

  let seq = 1;
  if (ultima) {
    const partes = ultima.numero.split("-");
    seq = parseInt(partes[partes.length - 1], 10) + 1;
  }

  return `${prefixo}${String(seq).padStart(4, "0")}`;
}

type CriarFaturaParams = {
  lojaId: string;
  pedidoId: string;
  subtotal: number;
  desconto: number;
  total: number;
  moeda: string;
  taxaIva?: number; // percentagem, ex: 14 para 14%
  clienteNome?: string | null;
  clienteEmail?: string | null;
  clienteNif?: string | null;
  clienteMorada?: Record<string, unknown> | null;
  lojaNome?: string | null;
  lojaNif?: string | null;
  lojaMorada?: string | null;
  emitidaPor?: string | null;
};

export async function criarFatura(params: CriarFaturaParams): Promise<string> {
  const ano = new Date().getFullYear();
  const numero = await gerarNumeroFatura(params.lojaId, ano);
  const taxaIva = params.taxaIva ?? 0;
  const ivaValor = Math.round((params.total * (taxaIva / (100 + taxaIva))) * 100) / 100;

  await prisma.fatura.upsert({
    where: { pedidoId: params.pedidoId },
    create: {
      lojaId: params.lojaId,
      pedidoId: params.pedidoId,
      numero,
      estado: "EMITIDA",
      subtotal: params.subtotal,
      desconto: params.desconto,
      iva: ivaValor,
      total: params.total,
      moeda: params.moeda,
      clienteNome: params.clienteNome,
      clienteEmail: params.clienteEmail,
      clienteNif: params.clienteNif,
      clienteMorada: params.clienteMorada
        ? JSON.parse(JSON.stringify(params.clienteMorada))
        : undefined,
      lojaNome: params.lojaNome,
      lojaNif: params.lojaNif,
      lojaMorada: params.lojaMorada,
      emitidaEm: new Date(),
      emitidaPor: params.emitidaPor ?? null,
    },
    update: {}, // já existe — não sobrescrever
  });

  return numero;
}

export async function anularFatura(faturaId: string, lojaId: string): Promise<void> {
  await prisma.fatura.updateMany({
    where: { id: faturaId, lojaId, estado: { not: "ANULADA" } },
    data: { estado: "ANULADA", anuladaEm: new Date() },
  });
}
