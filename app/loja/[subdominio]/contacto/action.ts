"use server";

import { z } from "zod";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY ?? "");
const FROM = process.env.EMAIL_FROM ?? "LinkCommerce <onboarding@resend.dev>";

const Schema = z.object({
  subdominio: z.string(),
  nome: z.string().min(2),
  email: z.string().email(),
  assunto: z.string().min(2),
  mensagem: z.string().min(10),
});

export async function enviarMensagemContacto(_: unknown, formData: FormData) {
  const parsed = Schema.safeParse({
    subdominio: formData.get("subdominio"),
    nome: formData.get("nome"),
    email: formData.get("email"),
    assunto: formData.get("assunto"),
    mensagem: formData.get("mensagem"),
  });

  if (!parsed.success) return { erro: "Preencha todos os campos correctamente." };

  const { subdominio, nome, email, assunto, mensagem } = parsed.data;

  const loja = await prisma.loja.findUnique({
    where: { subdominio },
    include: { utilizadores: { where: { role: "LOJISTA" }, select: { email: true }, take: 1 } },
  });
  if (!loja) return { erro: "Loja não encontrada." };

  const emailLojista = loja.utilizadores[0]?.email;
  if (!emailLojista) return { erro: "Não foi possível enviar. Tente mais tarde." };

  const html = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"></head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#1e293b">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <tr><td style="background:#0f172a;padding:24px 32px">
          <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700">✉️ Nova mensagem de contacto</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.5);font-size:13px">${loja.nome}</p>
        </td></tr>
        <tr><td style="padding:32px">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
            <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;width:100px">De</td>
                <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600">${nome} &lt;${email}&gt;</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b">Assunto</td>
                <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600">${assunto}</td></tr>
          </table>
          <div style="background:#f8fafc;border-radius:12px;padding:16px">
            <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;white-space:pre-wrap">${mensagem}</p>
          </div>
          <p style="margin:20px 0 0;font-size:12px;color:#94a3b8">
            Para responder, basta responder directamente a este email — o cliente receberá a sua resposta.
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0">
          <p style="margin:0;font-size:11px;color:#94a3b8">LinkCommerce · Epata Lda</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    await resend.emails.send({
      from: FROM,
      to: emailLojista,
      replyTo: email,
      subject: `✉️ Contacto de ${nome}: ${assunto} — ${loja.nome}`,
      html,
    });
    return { sucesso: true };
  } catch {
    return { erro: "Erro ao enviar. Tente novamente." };
  }
}
