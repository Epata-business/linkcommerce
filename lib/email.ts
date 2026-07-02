import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");
const FROM = process.env.EMAIL_FROM ?? "LinkCommerce <noreply@linkcommerce.app>";

export interface PedidoEmailData {
  nomeLoja: string;
  clienteNome: string;
  clienteEmail: string;
  pedidoId: string;
  itens: { titulo: string; quantidade: number; precoUnitario: number }[];
  total: number;
  moeda: string;
  emailLojista?: string;
}

function formatarPreco(valor: number, moeda: string) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: moeda }).format(valor);
}

function templateConfirmacaoPedido(data: PedidoEmailData): string {
  const linhas = data.itens
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9">${i.titulo}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:center">${i.quantidade}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right">${formatarPreco(i.precoUnitario, data.moeda)}</td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#1e293b">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#153DFC,#8381FB);padding:32px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800">${data.nomeLoja}</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px">Pedido confirmado ✓</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;font-size:16px">Olá, <strong>${data.clienteNome}</strong>!</p>
          <p style="margin:0 0 24px;color:#64748b;font-size:14px">Recebemos o seu pedido <strong>#${data.pedidoId.slice(-8).toUpperCase()}</strong> e está a ser processado.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
            <tr>
              <th style="text-align:left;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;padding-bottom:8px;border-bottom:2px solid #e2e8f0">Produto</th>
              <th style="text-align:center;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;padding-bottom:8px;border-bottom:2px solid #e2e8f0">Qtd.</th>
              <th style="text-align:right;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;padding-bottom:8px;border-bottom:2px solid #e2e8f0">Preço</th>
            </tr>
            ${linhas}
            <tr>
              <td colspan="2" style="padding-top:16px;font-weight:700">Total</td>
              <td style="padding-top:16px;font-weight:800;color:#153DFC;text-align:right;font-size:18px">${formatarPreco(data.total, data.moeda)}</td>
            </tr>
          </table>

          <div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:24px">
            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6">
              📦 Assim que o pedido for enviado, receberá outro email com o número de tracking.<br>
              ❓ Questões? Responda a este email ou contacte <strong>${data.nomeLoja}</strong> diretamente.
            </p>
          </div>

          <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center">Obrigado por comprar em <strong>${data.nomeLoja}</strong></p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0">
          <p style="margin:0;font-size:11px;color:#94a3b8">Powered by <strong>LinkCommerce</strong> · Epata Lda</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function templateNovoPedidoLojista(data: PedidoEmailData): string {
  const linhas = data.itens
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9">${i.titulo}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:center">${i.quantidade}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right">${formatarPreco(i.precoUnitario, data.moeda)}</td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"></head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#1e293b">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <tr><td style="background:#0f172a;padding:24px 32px">
          <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700">🛍️ Novo pedido recebido!</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.5);font-size:13px">${data.nomeLoja}</p>
        </td></tr>
        <tr><td style="padding:32px">
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:24px">
            <p style="margin:0;font-size:22px;font-weight:800;color:#15803d">${formatarPreco(data.total, data.moeda)}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#16a34a">Pedido #${data.pedidoId.slice(-8).toUpperCase()} · ${data.clienteNome} (${data.clienteEmail})</p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <th style="text-align:left;font-size:12px;color:#94a3b8;text-transform:uppercase;padding-bottom:8px;border-bottom:2px solid #e2e8f0">Produto</th>
              <th style="text-align:center;font-size:12px;color:#94a3b8;text-transform:uppercase;padding-bottom:8px;border-bottom:2px solid #e2e8f0">Qtd.</th>
              <th style="text-align:right;font-size:12px;color:#94a3b8;text-transform:uppercase;padding-bottom:8px;border-bottom:2px solid #e2e8f0">Preço</th>
            </tr>
            ${linhas}
          </table>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0">
          <p style="margin:0;font-size:11px;color:#94a3b8">LinkCommerce · Epata Lda</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export interface EnvioEmailData {
  nomeLoja: string;
  clienteNome: string;
  clienteEmail: string;
  pedidoId: string;
  tracking?: string;
}

export async function enviarEmailPedidoEnviado(data: EnvioEmailData) {
  const html = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#1e293b">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px;text-align:center">
          <div style="font-size:48px;margin-bottom:8px">📦</div>
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800">${data.nomeLoja}</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px">O seu pedido foi enviado!</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 16px;font-size:16px">Olá, <strong>${data.clienteNome}</strong>!</p>
          <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6">
            O seu pedido <strong>#${data.pedidoId.slice(-8).toUpperCase()}</strong> foi enviado e está a caminho!
          </p>
          ${data.tracking ? `
          <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center">
            <p style="margin:0 0 4px;font-size:12px;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Número de Tracking</p>
            <p style="margin:0;font-size:22px;font-weight:800;color:#4f46e5;letter-spacing:.05em">${data.tracking}</p>
            <p style="margin:8px 0 0;font-size:12px;color:#6d28d9">Use este código para seguir a sua encomenda no site do transportador</p>
          </div>
          ` : `
          <div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:24px">
            <p style="margin:0;font-size:13px;color:#64748b;">📍 O número de tracking será disponibilizado assim que possível.</p>
          </div>
          `}
          <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center">
            Obrigado por comprar em <strong>${data.nomeLoja}</strong>
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0">
          <p style="margin:0;font-size:11px;color:#94a3b8">Powered by <strong>LinkCommerce</strong> · Epata Lda</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to: data.clienteEmail,
    subject: `📦 O seu pedido foi enviado — ${data.nomeLoja} #${data.pedidoId.slice(-8).toUpperCase()}`,
    html,
  });
}

export async function enviarEmailConfirmacaoPedido(data: PedidoEmailData) {
  const promises: Promise<unknown>[] = [];

  // Email para o cliente
  promises.push(
    resend.emails.send({
      from: FROM,
      to: data.clienteEmail,
      subject: `Pedido confirmado — ${data.nomeLoja} #${data.pedidoId.slice(-8).toUpperCase()}`,
      html: templateConfirmacaoPedido(data),
    })
  );

  // Email para o lojista
  if (data.emailLojista) {
    promises.push(
      resend.emails.send({
        from: FROM,
        to: data.emailLojista,
        subject: `🛍️ Novo pedido de ${data.clienteNome} — ${formatarPreco(data.total, data.moeda)}`,
        html: templateNovoPedidoLojista(data),
      })
    );
  }

  await Promise.allSettled(promises);
}
