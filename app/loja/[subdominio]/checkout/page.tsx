"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { formatarPreco } from "@/lib/moeda";

// Lê locale do cookie no cliente
function getClientLocale(): string {
  if (typeof document === "undefined") return "pt";
  const m = document.cookie.match(/(?:^|;\s*)LC=([^;]+)/);
  return m?.[1] ?? "pt";
}

type TMap = Record<string, string>;

const TR: Record<string, TMap> = {
  pt: {
    breadcrumb_store: "Loja", breadcrumb_cart: "Carrinho", breadcrumb_checkout: "Checkout",
    empty_title: "O carrinho está vazio", empty_sub: "Adicione produtos antes de finalizar a compra.",
    back_store: "Voltar à loja",
    step_info: "Informações", step_delivery: "Entrega", step_payment: "Pagamento",
    contact_title: "Informações de contacto",
    name: "Nome completo", email: "Email", phone: "Telemóvel",
    bi: "BI / Passaporte", nif: "NIF (opcional)", nif_ph: "NIF para fatura",
    fill_required: "Preencha o nome e email.",
    continue_delivery: "Continuar para entrega →",
    delivery_title: "Morada de entrega",
    street: "Rua / Avenida", city: "Cidade", postal: "Código postal", country: "País",
    delivery_note: "🚚 O prazo e custo de entrega são definidos pelo lojista e serão confirmados por email após o pedido.",
    fill_address: "Preencha a rua e cidade.",
    back: "← Voltar", continue_payment: "Continuar para pagamento →",
    payment_title: "Método de pagamento",
    mbway_note: "📱 Após confirmar, receberá uma notificação no seu telemóvel para aprovar o pagamento.",
    multibanco_note: "🏧 Receberá uma referência Multibanco por email. Tem 3 dias para pagar em qualquer caixa ATM.",
    multicaixa_note: "📲 Após confirmar, receberá as instruções de pagamento via Multicaixa Express.",
    processing: "A processar…", confirm: "Confirmar pedido",
    ssl: "SSL 256-bit", protected: "Dados protegidos", returns_14: "14 dias devolução",
    summary: "Resumo do pedido", qty: "Qtd.", subtotal: "Subtotal",
    shipping: "Envio", shipping_calc: "A calcular", total: "Total",
    guarantee_payment: "Pagamento seguro", guarantee_payment_sub: "Encriptação SSL em todos os dados",
    guarantee_returns: "Devolução gratuita", guarantee_returns_sub: "14 dias sem questões",
    guarantee_shipping: "Envio pelo lojista", guarantee_shipping_sub: "Prazo confirmado por email",
    pay_card: "Cartão de crédito / débito", pay_card_sub: "Visa, Mastercard, American Express",
    pay_mbway_sub: "Pague com o seu telemóvel", pay_multibanco_sub: "Pague em qualquer caixa ATM",
    pay_multicaixa_sub: "Pagamento via EMIS Angola", pay_paypal_sub: "Pague com a sua conta PayPal",
    country_default: "Portugal",
  },
  en: {
    breadcrumb_store: "Store", breadcrumb_cart: "Cart", breadcrumb_checkout: "Checkout",
    empty_title: "Your cart is empty", empty_sub: "Add products before checking out.",
    back_store: "Back to store",
    step_info: "Information", step_delivery: "Delivery", step_payment: "Payment",
    contact_title: "Contact information",
    name: "Full name", email: "Email", phone: "Phone",
    bi: "ID / Passport", nif: "Tax ID (optional)", nif_ph: "Tax ID for invoice",
    fill_required: "Please fill in name and email.",
    continue_delivery: "Continue to delivery →",
    delivery_title: "Delivery address",
    street: "Street / Avenue", city: "City", postal: "Postal code", country: "Country",
    delivery_note: "🚚 Delivery time and cost are set by the seller and will be confirmed by email after the order.",
    fill_address: "Please fill in street and city.",
    back: "← Back", continue_payment: "Continue to payment →",
    payment_title: "Payment method",
    mbway_note: "📱 After confirming, you will receive a notification on your phone to approve the payment.",
    multibanco_note: "🏧 You will receive a Multibanco reference by email. You have 3 days to pay at any ATM.",
    multicaixa_note: "📲 After confirming, you will receive payment instructions via Multicaixa Express.",
    processing: "Processing…", confirm: "Confirm order",
    ssl: "SSL 256-bit", protected: "Data protected", returns_14: "14-day returns",
    summary: "Order summary", qty: "Qty.", subtotal: "Subtotal",
    shipping: "Shipping", shipping_calc: "To be calculated", total: "Total",
    guarantee_payment: "Secure payment", guarantee_payment_sub: "SSL encryption on all data",
    guarantee_returns: "Free returns", guarantee_returns_sub: "14 days no questions asked",
    guarantee_shipping: "Shipped by seller", guarantee_shipping_sub: "Deadline confirmed by email",
    pay_card: "Credit / Debit card", pay_card_sub: "Visa, Mastercard, American Express",
    pay_mbway_sub: "Pay with your phone", pay_multibanco_sub: "Pay at any ATM",
    pay_multicaixa_sub: "Payment via EMIS Angola", pay_paypal_sub: "Pay with your PayPal account",
    country_default: "Angola",
  },
  fr: {
    breadcrumb_store: "Boutique", breadcrumb_cart: "Panier", breadcrumb_checkout: "Commande",
    empty_title: "Votre panier est vide", empty_sub: "Ajoutez des produits avant de finaliser.",
    back_store: "Retour à la boutique",
    step_info: "Informations", step_delivery: "Livraison", step_payment: "Paiement",
    contact_title: "Informations de contact",
    name: "Nom complet", email: "Email", phone: "Téléphone",
    bi: "Pièce d'identité / Passeport", nif: "Numéro fiscal (optionnel)", nif_ph: "Numéro fiscal pour facture",
    fill_required: "Veuillez remplir le nom et l'email.",
    continue_delivery: "Continuer vers la livraison →",
    delivery_title: "Adresse de livraison",
    street: "Rue / Avenue", city: "Ville", postal: "Code postal", country: "Pays",
    delivery_note: "🚚 Le délai et le coût de livraison sont définis par le vendeur et seront confirmés par email.",
    fill_address: "Veuillez remplir la rue et la ville.",
    back: "← Retour", continue_payment: "Continuer vers le paiement →",
    payment_title: "Mode de paiement",
    mbway_note: "📱 Après confirmation, vous recevrez une notification sur votre téléphone.",
    multibanco_note: "🏧 Vous recevrez une référence par email. Vous avez 3 jours pour payer.",
    multicaixa_note: "📲 Après confirmation, vous recevrez les instructions de paiement.",
    processing: "Traitement…", confirm: "Confirmer la commande",
    ssl: "SSL 256-bit", protected: "Données protégées", returns_14: "14 jours retours",
    summary: "Résumé de la commande", qty: "Qté.", subtotal: "Sous-total",
    shipping: "Livraison", shipping_calc: "À calculer", total: "Total",
    guarantee_payment: "Paiement sécurisé", guarantee_payment_sub: "Chiffrement SSL sur toutes les données",
    guarantee_returns: "Retours gratuits", guarantee_returns_sub: "14 jours sans questions",
    guarantee_shipping: "Expédié par le vendeur", guarantee_shipping_sub: "Délai confirmé par email",
    pay_card: "Carte de crédit / débit", pay_card_sub: "Visa, Mastercard, American Express",
    pay_mbway_sub: "Payez avec votre téléphone", pay_multibanco_sub: "Payez dans n'importe quel DAB",
    pay_multicaixa_sub: "Paiement via EMIS Angola", pay_paypal_sub: "Payez avec votre compte PayPal",
    country_default: "Portugal",
  },
  es: {
    breadcrumb_store: "Tienda", breadcrumb_cart: "Carrito", breadcrumb_checkout: "Pago",
    empty_title: "Tu carrito está vacío", empty_sub: "Añade productos antes de finalizar.",
    back_store: "Volver a la tienda",
    step_info: "Información", step_delivery: "Entrega", step_payment: "Pago",
    contact_title: "Información de contacto",
    name: "Nombre completo", email: "Email", phone: "Teléfono",
    bi: "DNI / Pasaporte", nif: "NIF (opcional)", nif_ph: "NIF para factura",
    fill_required: "Por favor completa el nombre y email.",
    continue_delivery: "Continuar con la entrega →",
    delivery_title: "Dirección de entrega",
    street: "Calle / Avenida", city: "Ciudad", postal: "Código postal", country: "País",
    delivery_note: "🚚 El plazo y coste de entrega son definidos por el vendedor y se confirmarán por email.",
    fill_address: "Por favor completa la calle y ciudad.",
    back: "← Volver", continue_payment: "Continuar con el pago →",
    payment_title: "Método de pago",
    mbway_note: "📱 Tras confirmar, recibirás una notificación en tu teléfono para aprobar el pago.",
    multibanco_note: "🏧 Recibirás una referencia Multibanco por email. Tienes 3 días para pagar.",
    multicaixa_note: "📲 Tras confirmar, recibirás las instrucciones de pago via Multicaixa Express.",
    processing: "Procesando…", confirm: "Confirmar pedido",
    ssl: "SSL 256-bit", protected: "Datos protegidos", returns_14: "14 días devolución",
    summary: "Resumen del pedido", qty: "Cant.", subtotal: "Subtotal",
    shipping: "Envío", shipping_calc: "A calcular", total: "Total",
    guarantee_payment: "Pago seguro", guarantee_payment_sub: "Encriptación SSL en todos los datos",
    guarantee_returns: "Devolución gratuita", guarantee_returns_sub: "14 días sin preguntas",
    guarantee_shipping: "Enviado por el vendedor", guarantee_shipping_sub: "Plazo confirmado por email",
    pay_card: "Tarjeta de crédito / débito", pay_card_sub: "Visa, Mastercard, American Express",
    pay_mbway_sub: "Paga con tu teléfono", pay_multibanco_sub: "Paga en cualquier cajero",
    pay_multicaixa_sub: "Pago via EMIS Angola", pay_paypal_sub: "Paga con tu cuenta PayPal",
    country_default: "Portugal",
  },
};

function Campo({ label, name, type = "text", placeholder, required, value, onChange, half }: {
  label: string; name: string; type?: string; placeholder?: string;
  required?: boolean; value: string; onChange: (v: string) => void; half?: boolean;
}) {
  return (
    <div className={half ? "col-span-1" : "col-span-2"}>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
      <input name={name} type={type} placeholder={placeholder} required={required}
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-colors"
      />
    </div>
  );
}

function Stepper({ atual, steps }: { atual: number; steps: string[] }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${i < atual ? "bg-green-500 text-white" : i === atual ? "text-white" : "bg-slate-100 text-slate-400"}`}
              style={i === atual ? { background: "linear-gradient(135deg,#153DFC,#8381FB)" } : {}}>
              {i < atual ? "✓" : i + 1}
            </div>
            <span className={`mt-1 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap
              ${i <= atual ? "text-slate-700" : "text-slate-300"}`}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${i < atual ? "bg-green-400" : "bg-slate-100"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function CheckoutPage({ params }: { params: { subdominio: string } }) {
  const router = useRouter();
  const itens = useCartStore((s) => s.itens);
  const limpar = useCartStore((s) => s.limpar);

  const [locale, setLocale] = useState("pt");
  const [passo, setPasso] = useState(0);
  const [aSubmeter, setASubmeter] = useState(false);
  const [erro, setErro] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState("cartao");
  const [morada, setMorada] = useState({ rua: "", cidade: "", codigoPostal: "", pais: "" });
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [bi, setBi] = useState("");
  const [nifComprador, setNifComprador] = useState("");
  const [cor, setCor] = useState("#153DFC");

  useEffect(() => {
    useCartStore.persist.rehydrate();
    const l = getClientLocale();
    setLocale(l);
    const c = getComputedStyle(document.documentElement).getPropertyValue("--cor-primaria").trim();
    if (c) setCor(c);
    setMorada(m => ({ ...m, pais: (TR[l] ?? TR.pt).country_default }));
  }, []);

  const tr = TR[locale] ?? TR.pt;
  const steps = [tr.step_info, tr.step_delivery, tr.step_payment];

  const subtotal = itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
  const total = subtotal;

  const METODOS = [
    { id: "cartao",     label: tr.pay_card,         sub: tr.pay_card_sub,        icon: <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}><rect x="1" y="4" width="22" height="16" rx="2" /><path strokeLinecap="round" d="M1 10h22" /></svg> },
    { id: "mbway",      label: "MB WAY",             sub: tr.pay_mbway_sub,       icon: <span className="text-xl font-black text-red-500">MB</span>,     paisFlag: "🇵🇹" },
    { id: "multibanco", label: "Multibanco",         sub: tr.pay_multibanco_sub,  icon: <span className="text-xl font-black text-blue-600">ATM</span>,   paisFlag: "🇵🇹" },
    { id: "multicaixa", label: "Multicaixa Express", sub: tr.pay_multicaixa_sub,  icon: <span className="text-xl font-black text-yellow-600">MCX</span>, paisFlag: "🇦🇴" },
    { id: "paypal",     label: "PayPal",             sub: tr.pay_paypal_sub,      icon: <span className="text-xl font-bold text-blue-700">P</span> },
  ];

  const COUNTRIES = locale === "en"
    ? ["Angola","Portugal","Brazil","Mozambique","Cape Verde","Other"]
    : locale === "fr"
    ? ["Angola","Portugal","Brésil","Mozambique","Cap-Vert","Autre"]
    : locale === "es"
    ? ["Angola","Portugal","Brasil","Mozambique","Cabo Verde","Otro"]
    : ["Portugal","Angola","Brasil","Moçambique","Cabo Verde","São Tomé e Príncipe","Guiné-Bissau","Timor-Leste","Outro"];

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4">
        <div className="text-6xl mb-5">🛒</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">{tr.empty_title}</h2>
        <p className="text-slate-400 text-sm mb-6">{tr.empty_sub}</p>
        <Link href={`/loja/${params.subdominio}`}
          className="rounded-xl px-6 py-2.5 text-sm font-bold text-white"
          style={{ background: `linear-gradient(135deg,${cor},${cor}bb)` }}>
          {tr.back_store}
        </Link>
      </div>
    );
  }

  async function handlePagar() {
    setASubmeter(true);
    setErro("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdominio: params.subdominio,
          itens: itens.map((i) => ({
            produtoId: i.produtoId, varianteId: i.varianteId,
            titulo: i.titulo, precoUnitario: i.precoUnitario,
            quantidade: i.quantidade, imagemUrl: i.imagemUrl,
          })),
          clienteEmail: email, clienteNome: nome, clienteTelefone: telefone,
          morada: { ...morada, bi, nif: nifComprador, clienteTelefone: telefone },
          metodoPagamento,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "Error");
      limpar();
      router.push(data.redirectUrl);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Unexpected error.");
      setASubmeter(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Link href={`/loja/${params.subdominio}`} className="hover:text-slate-700 transition-colors">{tr.breadcrumb_store}</Link>
          <span>›</span>
          <span>{tr.breadcrumb_cart}</span>
          <span>›</span>
          <span className="text-slate-700 font-medium">{tr.breadcrumb_checkout}</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">

          {/* Formulário */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <Stepper atual={passo} steps={steps} />

              {/* Passo 0 — Informações */}
              {passo === 0 && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-slate-800 mb-4">{tr.contact_title}</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <Campo label={tr.name} name="nome" placeholder="João Silva" required value={nome} onChange={setNome} />
                    <Campo label={tr.email} name="email" type="email" placeholder="email@example.com" required value={email} onChange={setEmail} />
                    <Campo label={tr.phone} name="telefone" type="tel" placeholder="+244 900 000 000" value={telefone} onChange={setTelefone} half />
                    <Campo label={tr.bi} name="bi" placeholder="000000000LA000" value={bi} onChange={setBi} half />
                    <Campo label={tr.nif} name="nif" placeholder={tr.nif_ph} value={nifComprador} onChange={setNifComprador} half />
                  </div>
                  <button onClick={() => { if (!nome || !email) { setErro(tr.fill_required); return; } setErro(""); setPasso(1); }}
                    className="mt-4 w-full rounded-xl py-3.5 font-bold text-white text-sm hover:opacity-90 active:scale-95 transition-all"
                    style={{ background: `linear-gradient(135deg,${cor},${cor}bb)` }}>
                    {tr.continue_delivery}
                  </button>
                </div>
              )}

              {/* Passo 1 — Entrega */}
              {passo === 1 && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-slate-800 mb-4">{tr.delivery_title}</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <Campo label={tr.street} name="rua" placeholder="Rua de Exemplo, 123" required value={morada.rua} onChange={(v) => setMorada(m => ({ ...m, rua: v }))} />
                    <Campo label={tr.city} name="cidade" placeholder="Lisboa" required half value={morada.cidade} onChange={(v) => setMorada(m => ({ ...m, cidade: v }))} />
                    <Campo label={tr.postal} name="codigoPostal" placeholder="1000-001" required half value={morada.codigoPostal} onChange={(v) => setMorada(m => ({ ...m, codigoPostal: v }))} />
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{tr.country}</label>
                      <select value={morada.pais} onChange={(e) => setMorada(m => ({ ...m, pais: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25">
                        {COUNTRIES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">{tr.delivery_note}</div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => { setErro(""); setPasso(0); }}
                      className="flex-1 rounded-xl py-3 font-semibold text-slate-600 text-sm border border-slate-200 hover:bg-slate-50 transition-colors">
                      {tr.back}
                    </button>
                    <button onClick={() => { if (!morada.rua || !morada.cidade) { setErro(tr.fill_address); return; } setErro(""); setPasso(2); }}
                      className="flex-[2] rounded-xl py-3.5 font-bold text-white text-sm hover:opacity-90 active:scale-95 transition-all"
                      style={{ background: `linear-gradient(135deg,${cor},${cor}bb)` }}>
                      {tr.continue_payment}
                    </button>
                  </div>
                </div>
              )}

              {/* Passo 2 — Pagamento */}
              {passo === 2 && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-slate-800 mb-4">{tr.payment_title}</h2>
                  <div className="space-y-2">
                    {METODOS.map((m) => {
                      const ativo = metodoPagamento === m.id;
                      return (
                        <button key={m.id} type="button" onClick={() => setMetodoPagamento(m.id)}
                          className="w-full flex items-center gap-4 rounded-xl border-2 px-4 py-3.5 text-left transition-all"
                          style={{ borderColor: ativo ? cor : "#e2e8f0", background: ativo ? `${cor}08` : "#fff" }}>
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">{m.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                              {m.label}{m.paisFlag && <span className="text-base">{m.paisFlag}</span>}
                            </p>
                            <p className="text-xs text-slate-400">{m.sub}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${ativo ? "border-0" : "border-slate-300"}`}
                            style={ativo ? { background: cor } : {}}>
                            {ativo && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {metodoPagamento === "mbway" && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">{tr.mbway_note}</div>}
                  {metodoPagamento === "multibanco" && <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">{tr.multibanco_note}</div>}
                  {metodoPagamento === "multicaixa" && <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-3 text-xs text-yellow-800">{tr.multicaixa_note}</div>}

                  {erro && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{erro}</div>}

                  <div className="flex gap-3 mt-4">
                    <button onClick={() => { setErro(""); setPasso(1); }}
                      className="flex-1 rounded-xl py-3 font-semibold text-slate-600 text-sm border border-slate-200 hover:bg-slate-50 transition-colors">
                      {tr.back}
                    </button>
                    <button onClick={handlePagar} disabled={aSubmeter}
                      className="flex-[2] rounded-xl py-3.5 font-bold text-white text-sm hover:opacity-90 active:scale-95 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                      style={{ background: `linear-gradient(135deg,${cor},${cor}bb)` }}>
                      {aSubmeter
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{tr.processing}</>
                        : `${tr.confirm} · ${formatarPreco(total, "EUR")}`}
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-4 pt-2">
                    {[["🔒", tr.ssl], ["✓", tr.protected], ["↩️", tr.returns_14]].map(([icon, label]) => (
                      <div key={label} className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span>{icon}</span> {label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {erro && passo !== 2 && (
                <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{erro}</div>
              )}
            </div>
          </div>

          {/* Resumo */}
          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-bold text-slate-800 mb-4">{tr.summary}</h3>
              <div className="space-y-3 mb-4">
                {itens.map((item) => (
                  <div key={`${item.produtoId}-${item.varianteId}`} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden">
                      {item.imagemUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={item.imagemUrl} alt={item.titulo} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-lg font-black" style={{ color: cor }}>{item.titulo.charAt(0)}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.titulo}</p>
                      <p className="text-xs text-slate-400">{tr.qty} {item.quantidade}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-800 flex-shrink-0">
                      {formatarPreco(item.precoUnitario * item.quantidade, "EUR")}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>{tr.subtotal}</span><span>{formatarPreco(subtotal, "EUR")}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>{tr.shipping}</span><span className="text-green-600 font-medium">{tr.shipping_calc}</span>
                </div>
              </div>
              <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between items-center">
                <span className="font-bold text-slate-800">{tr.total}</span>
                <span className="text-2xl font-black" style={{ color: cor }}>{formatarPreco(total, "EUR")}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
              {[
                { icon: "🔒", t: tr.guarantee_payment, s: tr.guarantee_payment_sub },
                { icon: "↩️", t: tr.guarantee_returns, s: tr.guarantee_returns_sub },
                { icon: "📦", t: tr.guarantee_shipping, s: tr.guarantee_shipping_sub },
              ].map((g) => (
                <div key={g.t} className="flex items-center gap-3">
                  <span className="text-xl">{g.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{g.t}</p>
                    <p className="text-[10px] text-slate-400">{g.s}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
