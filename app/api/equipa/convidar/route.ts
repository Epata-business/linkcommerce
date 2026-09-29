/**
 * POST /api/equipa/convidar
 * Envia convite por email para um novo membro da equipa.
 * - Se o utilizador já tem conta: adiciona directamente (comportamento anterior)
 * - Se não tem conta: cria token de convite e envia email com link para criar conta
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { auth } from "@/lib/auth";
import { ROLES_ATRIBUIVEIS, podeGerir } from "@/lib/rbac";
import { registarAudit } from "@/lib/audit";
import { randomBytes } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");
const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "linkcommerce.cc";

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!podeGerir(role)) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const lojaId = await getLojaId();
  const { email, novoRole } = await req.json();

  if (!email || !novoRole) {
    return NextResponse.json({ erro: "Email e função são obrigatórios" }, { status: 400 });
  }
  if (!ROLES_ATRIBUIVEIS.includes(novoRole)) {
    return NextResponse.json({ erro: "Função inválida" }, { status: 400 });
  }

  const emailNorm = (email as string).toLowerCase().trim();

  const loja = await prisma.loja.findUnique({
    where: { id: lojaId },
    select: { nome: true },
  });

  const utilizador = await prisma.user.findUnique({ where: { email: emailNorm } });

  if (utilizador) {
    // Utilizador já tem conta — adicionar directamente
    if (utilizador.lojaId && utilizador.lojaId !== lojaId) {
      return NextResponse.json({ erro: "Este utilizador pertence a outra loja." }, { status: 409 });
    }

    await prisma.user.update({
      where: { id: utilizador.id },
      data: { lojaId, role: novoRole },
    });

    void registarAudit({
      lojaId,
      userId: (session?.user as { id?: string } | undefined)?.id,
      userEmail: session?.user?.email ?? undefined,
      acao: "ADICIONAR",
      entidade: "Utilizador",
      entidadeId: utilizador.id,
      valoresNovos: { email: emailNorm, role: novoRole },
    });

    // Notificar por email que foi adicionado
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "LinkCommerce <noreply@linkcommerce.cc>",
      to: emailNorm,
      subject: `Adicionado à equipa de ${loja?.nome ?? "uma loja"} — LinkCommerce`,
      html: buildEmailAdicionado({ nomeLoja: loja?.nome ?? "Loja", email: emailNorm, role: novoRole }),
    }).catch(() => null);

    return NextResponse.json({ ok: true, jaExistia: true });
  }

  // Utilizador sem conta — criar token de convite (expira em 72h)
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const identifier = `invite:${lojaId}:${novoRole}:${emailNorm}`;

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({ data: { identifier, token, expires } });

  const url = `https://${ROOT}/aceitar-convite?token=${token}&email=${encodeURIComponent(emailNorm)}&loja=${encodeURIComponent(lojaId)}&role=${encodeURIComponent(novoRole)}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "LinkCommerce <noreply@linkcommerce.cc>",
    to: emailNorm,
    subject: `Convite para a equipa de ${loja?.nome ?? "uma loja"} — LinkCommerce`,
    html: buildEmailConvite({ nomeLoja: loja?.nome ?? "Loja", url, role: novoRole }),
  });

  void registarAudit({
    lojaId,
    userId: (session?.user as { id?: string } | undefined)?.id,
    userEmail: session?.user?.email ?? undefined,
    acao: "CONVIDAR",
    entidade: "Utilizador",
    valoresNovos: { email: emailNorm, role: novoRole },
  });

  return NextResponse.json({ ok: true, conviteEnviado: true });
}

function buildEmailConvite({ nomeLoja, url, role }: { nomeLoja: string; url: string; role: string }) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#080A12;color:#fff;border-radius:16px">
      <h1 style="font-size:22px;font-weight:800;margin:0 0 8px">Convite para a equipa</h1>
      <p style="color:rgba(255,255,255,0.6);margin:0 0 6px;font-size:14px">
        Foi convidado para se juntar à equipa da loja <strong style="color:#fff">${nomeLoja}</strong>
        na LinkCommerce como <strong style="color:#8381FB">${role}</strong>.
      </p>
      <p style="color:rgba(255,255,255,0.5);margin:0 0 24px;font-size:13px">
        Aceite o convite criando a sua conta. O link expira em 72 horas.
      </p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#153DFC,#8381FB);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px">
        Aceitar convite →
      </a>
      <p style="color:rgba(255,255,255,0.25);margin:24px 0 0;font-size:11px">
        Se não esperava este convite, pode ignorar este email.
      </p>
    </div>
  `;
}

function buildEmailAdicionado({ nomeLoja, email: _email, role }: { nomeLoja: string; email: string; role: string }) {
  const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "linkcommerce.cc";
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#080A12;color:#fff;border-radius:16px">
      <h1 style="font-size:22px;font-weight:800;margin:0 0 8px">Adicionado à equipa</h1>
      <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px">
        Foi adicionado à equipa da loja <strong style="color:#fff">${nomeLoja}</strong>
        com a função de <strong style="color:#8381FB">${role}</strong>.
      </p>
      <a href="https://${ROOT_URL}/entrar" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#153DFC,#8381FB);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px">
        Entrar no dashboard →
      </a>
    </div>
  `;
}
