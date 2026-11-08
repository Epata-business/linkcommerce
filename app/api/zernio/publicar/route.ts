import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { publicarPost } from "@/lib/zernio";
import { checkRateLimit } from "@/lib/rate-limit";
import { randomUUID } from "crypto";
import { z } from "zod";

const Schema = z.object({
  conteudo: z.string().min(1).max(2200),
  contaIds: z.array(z.string()).min(1).max(10),
  agendadoPara: z.string().datetime().optional(),
  publicarAgora: z.boolean().optional(),
  produtoId: z.string().optional(),
  imagens: z.array(z.string().url()).max(4).optional(),
});

// POST /api/zernio/publicar
// Publica ou agenda um post nas redes sociais selecionadas
export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, { prefix: "zernio-publicar", limit: 20, windowSec: 3600 });
  if (limited) return limited;

  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!session?.user || !userId) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const lojaId = await getLojaId();

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: "Dados inválidos", detalhes: parsed.error.flatten() }, { status: 400 });
  }

  const { conteudo, contaIds, agendadoPara, publicarAgora, produtoId, imagens } = parsed.data;

  // Verify all requested accounts belong to this store
  const contas = await prisma.contaSocial.findMany({
    where: { lojaId, id: { in: contaIds }, ativa: true },
  });

  if (contas.length !== contaIds.length) {
    return NextResponse.json({ erro: "Uma ou mais contas inválidas" }, { status: 400 });
  }

  const platforms = contas.map((c) => ({
    platform: c.plataforma,
    accountId: c.accountId,
  }));

  const idempotencyKey = randomUUID();

  // Record in DB first (optimistic, before Zernio call)
  const publicacao = await prisma.publicacaoSocial.create({
    data: {
      lojaId,
      produtoId: produtoId ?? null,
      conteudo,
      plataformas: JSON.stringify(contas.map((c) => c.plataforma)),
      estado: publicarAgora ? "agendado" : agendadoPara ? "agendado" : "rascunho",
      agendadoPara: agendadoPara ? new Date(agendadoPara) : null,
      criadoPor: userId,
    },
  });

  // Only call Zernio if we have an API key configured
  if (process.env.ZERNIO_API_KEY) {
    try {
      const post = await publicarPost({
        content: conteudo,
        platforms,
        ...(publicarAgora && { publishNow: true }),
        ...(agendadoPara && !publicarAgora && { scheduledFor: agendadoPara }),
        ...(imagens?.length && { mediaItems: imagens.map((url) => ({ url })) }),
        idempotencyKey,
      });

      await prisma.publicacaoSocial.update({
        where: { id: publicacao.id },
        data: {
          zernioPostId: post._id,
          estado: post.status === "published" ? "publicado" : "agendado",
          publicadoEm: post.status === "published" ? new Date() : null,
        },
      });

      return NextResponse.json({ ok: true, postId: post._id, publicacaoId: publicacao.id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await prisma.publicacaoSocial.update({
        where: { id: publicacao.id },
        data: { estado: "falhado", erroMsg: msg.slice(0, 500) },
      });
      return NextResponse.json({ erro: "Falha ao publicar", detalhe: msg.slice(0, 200) }, { status: 502 });
    }
  }

  // ZERNIO_API_KEY not configured — save as draft
  await prisma.publicacaoSocial.update({
    where: { id: publicacao.id },
    data: { estado: "rascunho" },
  });

  return NextResponse.json({ ok: true, publicacaoId: publicacao.id, aviso: "Zernio não configurado — guardado como rascunho" });
}

// GET /api/zernio/publicar — histórico de publicações desta loja
export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, { prefix: "zernio-publicar-list", limit: 60, windowSec: 60 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const lojaId = await getLojaId();
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10);
  const pageSize = 20;

  const [publicacoes, total] = await Promise.all([
    prisma.publicacaoSocial.findMany({
      where: { lojaId },
      orderBy: { criadoEm: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        conteudo: true,
        plataformas: true,
        estado: true,
        agendadoPara: true,
        publicadoEm: true,
        criadoEm: true,
        produtoId: true,
      },
    }),
    prisma.publicacaoSocial.count({ where: { lojaId } }),
  ]);

  return NextResponse.json({ publicacoes, total, page, pageSize });
}
