import { prisma } from "@/lib/prisma";

type RegistarAuditParams = {
  lojaId: string;
  userId?: string;
  userEmail?: string;
  acao: string;
  entidade: string;
  entidadeId?: string;
  valoresAntigos?: Record<string, unknown>;
  valoresNovos?: Record<string, unknown>;
};

export async function registarAudit(params: RegistarAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        lojaId: params.lojaId,
        userId: params.userId,
        userEmail: params.userEmail,
        acao: params.acao,
        entidade: params.entidade,
        entidadeId: params.entidadeId,
        valoresAntigos: params.valoresAntigos
          ? JSON.parse(JSON.stringify(params.valoresAntigos))
          : undefined,
        valoresNovos: params.valoresNovos
          ? JSON.parse(JSON.stringify(params.valoresNovos))
          : undefined,
      },
    });
  } catch {
    // não-crítico, nunca interrompe o fluxo principal
  }
}
