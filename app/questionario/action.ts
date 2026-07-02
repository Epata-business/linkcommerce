"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY ?? "");
const FROM = process.env.EMAIL_FROM ?? "LinkCommerce <onboarding@resend.dev>";
const DEST = "contato.epata@gmail.com";

export async function submeterQuestionario(_: unknown, formData: FormData) {
  const get = (k: string) => formData.get(k)?.toString() ?? "";
  const getAll = (k: string) => formData.getAll(k).map(String).filter(Boolean);

  const dados = {
    empresa: get("empresa"),
    oQueVende: get("oQueVende"),
    pais: getAll("pais"),
    setor: getAll("setor"),
    setorOutro: get("setorOutro"),
    numProdutos: get("numProdutos"),
    comoVende: getAll("comoVende"),
    dificuldades: getAll("dificuldades"),
    indispensavel: getAll("indispensavel"),
    pagamentos: getAll("pagamentos"),
    entregas: getAll("entregas"),
    ia: getAll("ia"),
    dispostoAPagar: get("dispostoAPagar"),
    mudancaPlataforma: getAll("mudancaPlataforma"),
    oQueFalta: get("oQueFalta"),
    plataformaPerfeita: get("plataformaPerfeita"),
    testarGratis: get("testarGratis"),
    nome: get("nome"),
    email: get("email"),
    telefone: get("telefone"),
  };

  const row = (label: string, value: string | string[]) => {
    const v = Array.isArray(value) ? value.join(", ") : value;
    if (!v) return "";
    return `<tr><td style="padding:8px 12px;font-size:13px;color:#64748b;white-space:nowrap;border-bottom:1px solid #f1f5f9;width:180px">${label}</td><td style="padding:8px 12px;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9;font-weight:500">${v}</td></tr>`;
  };

  const section = (title: string, rows: string) => `
    <tr><td colspan="2" style="padding:16px 12px 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8">${title}</td></tr>
    ${rows}`;

  const html = `<!DOCTYPE html><html lang="pt">
<head><meta charset="UTF-8"></head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#1e293b">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
  <tr><td style="background:linear-gradient(135deg,#153DFC,#8381FB);padding:28px 32px">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800">📋 Nova resposta ao questionário</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,.65);font-size:13px">${new Date().toLocaleString("pt-PT")}</p>
  </td></tr>
  <tr><td style="padding:12px 20px">
  <table width="100%" cellpadding="0" cellspacing="0">
    ${section("1. Sobre o negócio", [
      row("Empresa", dados.empresa),
      row("O que vende", dados.oQueVende),
      row("País", dados.pais),
      row("Setor", [...dados.setor, dados.setorOutro].filter(Boolean)),
      row("Nº produtos", dados.numProdutos),
    ].join(""))}
    ${section("2. Como vende hoje", [
      row("Canais atuais", dados.comoVende),
    ].join(""))}
    ${section("3. Maiores dificuldades", [
      row("Dificuldades", dados.dificuldades),
    ].join(""))}
    ${section("4. Indispensável", [
      row("Funcionalidades", dados.indispensavel),
    ].join(""))}
    ${section("5. Pagamentos", [
      row("Métodos", dados.pagamentos),
    ].join(""))}
    ${section("6. Entregas", [
      row("Como entrega", dados.entregas),
    ].join(""))}
    ${section("7. IA", [
      row("Funcionalidades IA", dados.ia),
    ].join(""))}
    ${section("8–9. Planos & Mudança", [
      row("Disposto a pagar", dados.dispostoAPagar),
      row("O que faria mudar", dados.mudancaPlataforma),
    ].join(""))}
    ${section("10–11. Perguntas abertas", [
      row("O que falta", dados.oQueFalta),
      row("Plataforma perfeita", dados.plataformaPerfeita),
    ].join(""))}
    ${section("12. Contacto", [
      row("Testar grátis", dados.testarGratis),
      row("Nome", dados.nome),
      row("Email", dados.email),
      row("Telefone", dados.telefone),
    ].join(""))}
  </table>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:11px;color:#94a3b8">LinkCommerce · Questionário de mercado</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  try {
    await resend.emails.send({
      from: FROM,
      to: DEST,
      replyTo: dados.email || undefined,
      subject: `📋 Novo questionário${dados.nome ? ` — ${dados.nome}` : ""}${dados.empresa ? ` (${dados.empresa})` : ""}`,
      html,
    });
    return { sucesso: true };
  } catch (e) {
    console.error("Erro ao enviar questionário:", e);
    return { erro: "Erro ao enviar. Tente novamente." };
  }
}
