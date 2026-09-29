import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");
const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "linkcommerce.cc";

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: true }); // resposta genérica por segurança
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, email: true, name: true, passwordHash: true },
  });

  // Resposta genérica: não revelar se email existe ou não
  if (!user || !user.passwordHash) {
    return NextResponse.json({ ok: true });
  }

  // Apagar tokens antigos para este email
  await prisma.verificationToken.deleteMany({ where: { identifier: user.email! } });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.verificationToken.create({
    data: { identifier: user.email!, token, expires },
  });

  const url = `https://${ROOT}/redefinir-senha?token=${token}&email=${encodeURIComponent(user.email!)}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "LinkCommerce <noreply@linkcommerce.cc>",
    to: user.email!,
    subject: "Redefinir senha — LinkCommerce",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#080A12;color:#fff;border-radius:16px">
        <h1 style="font-size:22px;font-weight:800;margin:0 0 8px">Redefinir a sua senha</h1>
        <p style="color:rgba(255,255,255,0.6);margin:0 0 24px;font-size:14px">
          Recebemos um pedido para redefinir a senha da conta associada a <strong>${user.email}</strong>.
        </p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#153DFC,#8381FB);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px">
          Redefinir senha →
        </a>
        <p style="color:rgba(255,255,255,0.35);margin:24px 0 0;font-size:12px">
          Este link expira em 1 hora. Se não solicitou a redefinição, pode ignorar este email — a sua senha não foi alterada.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
