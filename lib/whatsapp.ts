// WhatsApp Business Cloud API integration (Meta)
// Credenciais por loja guardadas em lojas.waPhoneId + lojas.waToken
// Fallback para variáveis de ambiente globais META_WA_TOKEN + META_WA_PHONE_ID
// Sem credenciais: retorna { enviado: false } sem lançar excepção — integração modular.

const META_API_URL = "https://graph.facebook.com/v19.0";

type WaMensagemTexto = {
  para: string;
  mensagem: string;
  token: string;
  phoneId: string;
};

type WaResultado = { enviado: boolean; motivo?: string };

// Resolve credenciais: loja-level tem precedência sobre env global
export function resolverCredenciaisWA(loja: { waToken?: string | null; waPhoneId?: string | null }): { token: string; phoneId: string } | null {
  const token = loja.waToken ?? process.env.META_WA_TOKEN;
  const phoneId = loja.waPhoneId ?? process.env.META_WA_PHONE_ID;
  if (!token || !phoneId) return null;
  return { token, phoneId };
}

async function enviarMensagemWA({ para, mensagem, token, phoneId }: WaMensagemTexto): Promise<WaResultado> {

  const numero = para.replace(/[\s\-()]/g, "").replace(/^00/, "+");

  try {
    const res = await fetch(`${META_API_URL}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: numero,
        type: "text",
        text: { body: mensagem },
      }),
    });
    if (!res.ok) {
      const erro = await res.text();
      console.warn("[WhatsApp] Erro ao enviar:", erro);
      return { enviado: false, motivo: erro };
    }
    return { enviado: true };
  } catch (err) {
    console.warn("[WhatsApp] Excepção ao enviar:", err);
    return { enviado: false, motivo: String(err) };
  }
}

// ---------------------------------------------------------------------------
// Templates de mensagem
// ---------------------------------------------------------------------------

type LojaWAConfig = { waToken?: string | null; waPhoneId?: string | null };

export async function notificarNovoPedidoLojista(params: {
  telefoneWA: string;
  nomeLoja: string;
  clienteNome: string;
  pedidoId: string;
  total: number;
  moeda: string;
  loja?: LojaWAConfig;
}): Promise<WaResultado> {
  const creds = resolverCredenciaisWA(params.loja ?? {});
  if (!creds) return { enviado: false, motivo: "não configurado" };
  const simbolo = params.moeda === "AOA" ? "Kz" : "€";
  const ref = params.pedidoId.slice(-8).toUpperCase();
  return enviarMensagemWA({
    para: params.telefoneWA,
    mensagem:
      `🛍️ *Novo pedido — ${params.nomeLoja}*\n\n` +
      `Cliente: ${params.clienteNome}\n` +
      `Ref: #${ref}\n` +
      `Total: ${params.total.toFixed(2)} ${simbolo}\n\n` +
      `Acede ao dashboard para processar o pedido.`,
    ...creds,
  });
}

export async function notificarPedidoEnviadoCliente(params: {
  telefoneCliente: string;
  nomeLoja: string;
  clienteNome: string;
  pedidoId: string;
  tracking?: string;
  loja?: LojaWAConfig;
}): Promise<WaResultado> {
  const creds = resolverCredenciaisWA(params.loja ?? {});
  if (!creds) return { enviado: false, motivo: "não configurado" };
  const ref = params.pedidoId.slice(-8).toUpperCase();
  const trackingLine = params.tracking ? `\nTracking: ${params.tracking}` : "";
  return enviarMensagemWA({
    para: params.telefoneCliente,
    mensagem:
      `📦 *O teu pedido foi enviado!*\n\n` +
      `Olá ${params.clienteNome}, o teu pedido #${ref} de *${params.nomeLoja}* foi enviado.${trackingLine}\n\n` +
      `Obrigado pela tua compra! 🙏`,
    ...creds,
  });
}

export async function notificarPagamentoConfirmadoCliente(params: {
  telefoneCliente: string;
  nomeLoja: string;
  clienteNome: string;
  pedidoId: string;
  total: number;
  moeda: string;
  loja?: LojaWAConfig;
}): Promise<WaResultado> {
  const creds = resolverCredenciaisWA(params.loja ?? {});
  if (!creds) return { enviado: false, motivo: "não configurado" };
  const simbolo = params.moeda === "AOA" ? "Kz" : "€";
  const ref = params.pedidoId.slice(-8).toUpperCase();
  return enviarMensagemWA({
    para: params.telefoneCliente,
    mensagem:
      `✅ *Pagamento confirmado — ${params.nomeLoja}*\n\n` +
      `Olá ${params.clienteNome}! Recebemos o pagamento de ${params.total.toFixed(2)} ${simbolo} para o pedido #${ref}.\n\n` +
      `Estamos a preparar o teu pedido. 🚀`,
    ...creds,
  });
}

// Link wa.me para o cliente entrar em contacto com a loja (sem API)
export function gerarLinkWA(telefone: string, mensagem?: string): string {
  const numero = telefone.replace(/[\s\-()]/g, "").replace(/^\+/, "");
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : "";
  return `https://wa.me/${numero}${texto}`;
}
