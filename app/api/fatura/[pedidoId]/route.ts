import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatarPreco(valor: number, moeda: string) {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: moeda }).format(valor);
}

function formatarData(date: Date) {
  return new Intl.DateTimeFormat("pt-AO", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export async function GET(req: NextRequest, { params }: { params: { pedidoId: string } }) {
  const pedido = await prisma.pedido.findFirst({
    where: { OR: [{ id: params.pedidoId }, { clientUuid: params.pedidoId }] },
    include: {
      itens: {
        include: { produto: { select: { titulo: true } }, variante: { select: { nomeOpcao: true } } },
      },
      loja: {
        select: {
          nome: true, nif: true, moradaFiscal: true,
          moeda: true, corPrimaria: true, logotipoUrl: true, subdominio: true,
        },
      },
    },
  });

  if (!pedido) return NextResponse.json({ erro: "Pedido não encontrado" }, { status: 404 });

  const moeda = pedido.loja?.moeda ?? "AOA";
  const cor = pedido.loja?.corPrimaria ?? "#153DFC";
  const moradaJson = (pedido.morada ?? {}) as Record<string, string>;
  const numFatura = pedido.id.slice(-8).toUpperCase();
  const subtotal = Number(pedido.subtotal ?? pedido.total);
  const desconto = Number(pedido.desconto ?? 0);
  const total = Number(pedido.total);
  const iva = total * 0.14; // IVA Angola 14%
  const totalSemIva = total - iva;

  const linhasProdutos = pedido.itens.map((item) => {
    const titulo = item.produto?.titulo ?? "Produto";
    const variante = item.variante?.nomeOpcao ? ` (${item.variante.nomeOpcao})` : "";
    const precoUnit = Number(item.precoUnitario);
    const subtotalItem = precoUnit * item.quantidade;
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155">${titulo}${variante}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:13px;color:#64748b">${item.quantidade}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px;color:#334155">${formatarPreco(precoUnit, moeda)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px;font-weight:600;color:#0f172a">${formatarPreco(subtotalItem, moeda)}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Fatura #${numFatura}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 32px 16px; }
    .page { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, ${cor}, ${cor}bb); padding: 36px 40px; color: white; display: flex; justify-content: space-between; align-items: flex-start; }
    .logo-area h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .logo-area p { font-size: 12px; opacity: 0.75; margin-top: 4px; }
    .fatura-ref { text-align: right; }
    .fatura-ref .label { font-size: 11px; opacity: 0.7; text-transform: uppercase; letter-spacing: .06em; }
    .fatura-ref .num { font-size: 26px; font-weight: 900; letter-spacing: -1px; }
    .fatura-ref .data { font-size: 12px; opacity: 0.8; margin-top: 4px; }
    .body { padding: 36px 40px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .info-box h3 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin-bottom: 10px; }
    .info-box p { font-size: 13px; color: #334155; line-height: 1.6; }
    .info-box p strong { color: #0f172a; font-weight: 700; }
    .badge { display: inline-block; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 700; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #f8fafc; }
    thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; border-bottom: 2px solid #e2e8f0; }
    thead th:not(:first-child) { text-align: right; }
    thead th:nth-child(2) { text-align: center; }
    .totals { margin-left: auto; width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #64748b; }
    .totals-row.total { border-top: 2px solid #e2e8f0; margin-top: 8px; padding-top: 12px; font-size: 17px; font-weight: 900; color: ${cor}; }
    .totals-row.total span:first-child { color: #0f172a; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; }
    .footer p { font-size: 11px; color: #94a3b8; }
    .stamp { border: 2px solid #e2e8f0; border-radius: 8px; padding: 12px 20px; text-align: center; min-width: 140px; }
    .stamp .label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; }
    .stamp .value { font-size: 13px; font-weight: 700; color: #334155; margin-top: 2px; }
    @media print {
      body { background: white; padding: 0; }
      .page { box-shadow: none; border-radius: 0; }
      .print-btn { display: none !important; }
    }
  </style>
</head>
<body>
  <div style="text-align:center;margin-bottom:16px" class="print-btn">
    <button onclick="window.print()" style="background:${cor};color:white;border:none;border-radius:8px;padding:10px 24px;font-size:14px;font-weight:700;cursor:pointer;">
      🖨️ Imprimir / Guardar PDF
    </button>
  </div>

  <div class="page">
    <!-- Cabeçalho -->
    <div class="header">
      <div class="logo-area">
        <h1>${pedido.loja?.nome ?? "Loja"}</h1>
        <p>${pedido.loja?.subdominio}.linkcommerce.app</p>
        ${pedido.loja?.nif ? `<p style="margin-top:6px;font-size:12px;opacity:.9">NIF: <strong>${pedido.loja.nif}</strong></p>` : ""}
        ${moradaJson.telefone ? `<p style="font-size:12px;opacity:.8">Tel: ${moradaJson.telefone}</p>` : ""}
        ${pedido.loja?.moradaFiscal ? `<p style="font-size:12px;opacity:.8;max-width:220px;line-height:1.4">${pedido.loja.moradaFiscal}</p>` : ""}
      </div>
      <div class="fatura-ref">
        <div class="label">Fatura</div>
        <div class="num">#${numFatura}</div>
        <div class="data">${formatarData(pedido.createdAt)}</div>
      </div>
    </div>

    <!-- Corpo -->
    <div class="body">
      <div class="badge">✓ Pago</div>

      <div class="grid-2">
        <!-- Dados do comprador -->
        <div class="info-box">
          <h3>Facturado a</h3>
          <p>
            <strong>${pedido.clienteNome}</strong><br>
            ${pedido.clienteEmail}<br>
            ${moradaJson.telefone ? `${moradaJson.telefone}<br>` : ""}
            ${moradaJson.bi ? `<span style="color:#64748b;font-size:12px">BI: <strong>${moradaJson.bi}</strong></span><br>` : ""}
            ${moradaJson.nif ? `<span style="color:#64748b;font-size:12px">NIF: <strong>${moradaJson.nif}</strong></span><br>` : ""}
            ${moradaJson.rua ? `${moradaJson.rua},<br>` : ""}
            ${moradaJson.cidade ? `${moradaJson.cidade}` : ""}
            ${moradaJson.codigoPostal ? ` — ${moradaJson.codigoPostal}` : ""}
            ${moradaJson.pais ? `<br>${moradaJson.pais}` : ""}
          </p>
        </div>

        <!-- Detalhes do pedido -->
        <div class="info-box">
          <h3>Detalhes do Pedido</h3>
          <p>
            <strong>Nº Pedido:</strong> #${numFatura}<br>
            <strong>Data:</strong> ${formatarData(pedido.createdAt)}<br>
            <strong>Método:</strong> ${moradaJson.metodoPagamento ?? "—"}<br>
            <strong>Estado:</strong> <span style="color:#16a34a">Pago</span>
          </p>
        </div>
      </div>

      <!-- Tabela de produtos -->
      <table>
        <thead>
          <tr>
            <th style="text-align:left">Descrição</th>
            <th style="text-align:center">Qtd.</th>
            <th style="text-align:right">Preço Unit.</th>
            <th style="text-align:right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${linhasProdutos}
        </tbody>
      </table>

      <!-- Totais -->
      <div class="totals">
        <div class="totals-row"><span>Subtotal</span><span>${formatarPreco(totalSemIva, moeda)}</span></div>
        <div class="totals-row"><span>IVA (14%)</span><span>${formatarPreco(iva, moeda)}</span></div>
        ${desconto > 0 ? `<div class="totals-row" style="color:#16a34a"><span>Desconto</span><span>-${formatarPreco(desconto, moeda)}</span></div>` : ""}
        <div class="totals-row total"><span>Total</span><span>${formatarPreco(total, moeda)}</span></div>
      </div>
    </div>

    <!-- Rodapé -->
    <div class="footer">
      <p>Fatura gerada por <strong>LinkCommerce</strong> · Epata Lda<br>Este documento serve como comprovativo de pagamento.</p>
      <div class="stamp">
        <div class="label">Estado</div>
        <div class="value" style="color:#16a34a">✓ PAGO</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-cache",
    },
  });
}
