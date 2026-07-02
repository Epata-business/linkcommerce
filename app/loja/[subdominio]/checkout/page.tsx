"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { formatarPreco } from "@/lib/moeda";

// ─── Métodos de pagamento ────────────────────────────────────────────────────
const METODOS = [
  {
    id: "cartao",
    label: "Cartão de crédito / débito",
    sub: "Visa, Mastercard, American Express",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.5}>
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <path strokeLinecap="round" d="M1 10h22" />
      </svg>
    ),
  },
  {
    id: "mbway",
    label: "MB WAY",
    sub: "Pague com o seu telemóvel",
    icon: <span className="text-xl font-black text-red-500">MB</span>,
    paisFlag: "🇵🇹",
  },
  {
    id: "multibanco",
    label: "Referência Multibanco",
    sub: "Pague em qualquer caixa ATM",
    icon: <span className="text-xl font-black text-blue-600">ATM</span>,
    paisFlag: "🇵🇹",
  },
  {
    id: "multicaixa",
    label: "Multicaixa Express",
    sub: "Pagamento via EMIS Angola",
    icon: <span className="text-xl font-black text-yellow-600">MCX</span>,
    paisFlag: "🇦🇴",
  },
  {
    id: "paypal",
    label: "PayPal",
    sub: "Pague com a sua conta PayPal",
    icon: <span className="text-xl font-bold text-blue-700">P</span>,
  },
];

// ─── Input reutilizável ──────────────────────────────────────────────────────
function Campo({
  label, name, type = "text", placeholder, required, value, onChange, half,
}: {
  label: string; name: string; type?: string; placeholder?: string;
  required?: boolean; value: string; onChange: (v: string) => void; half?: boolean;
}) {
  return (
    <div className={half ? "col-span-1" : "col-span-2"}>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
      <input
        name={name} type={type} placeholder={placeholder} required={required}
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-colors"
      />
    </div>
  );
}

// ─── Steps ──────────────────────────────────────────────────────────────────
const STEPS = ["Informações", "Entrega", "Pagamento"];

function Stepper({ atual }: { atual: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${i < atual ? "bg-green-500 text-white" : i === atual ? "text-white" : "bg-slate-100 text-slate-400"}`}
              style={i === atual ? { background: "linear-gradient(135deg,#153DFC,#8381FB)" } : {}}>
              {i < atual ? "✓" : i + 1}
            </div>
            <span className={`mt-1 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap
              ${i <= atual ? "text-slate-700" : "text-slate-300"}`}>
              {s}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${i < atual ? "bg-green-400" : "bg-slate-100"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function CheckoutPage({ params }: { params: { subdominio: string } }) {
  const router = useRouter();
  const itens = useCartStore((s) => s.itens);
  const limpar = useCartStore((s) => s.limpar);

  const [passo, setPasso] = useState(0);
  const [aSubmeter, setASubmeter] = useState(false);
  const [erro, setErro] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState("cartao");
  const [morada, setMorada] = useState({ rua: "", cidade: "", codigoPostal: "", pais: "Portugal" });

  // Dados pessoais
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  // Calcular totais
  const subtotal = itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
  const envio = 0; // por definir pelo lojista
  const total = subtotal + envio;

  // Reidratar store do carrinho (localStorage não existe no SSR)
  useEffect(() => { useCartStore.persist.rehydrate(); }, []);

  // Cor da loja via CSS variable
  const [cor, setCor] = useState("#153DFC");
  useEffect(() => {
    const c = getComputedStyle(document.documentElement).getPropertyValue("--cor-primaria").trim();
    if (c) setCor(c);
  }, []);

  // Carrinho vazio
  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4">
        <div className="text-6xl mb-5">🛒</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">O carrinho está vazio</h2>
        <p className="text-slate-400 text-sm mb-6">Adicione produtos antes de finalizar a compra.</p>
        <Link href={`/loja/${params.subdominio}`}
          className="rounded-xl px-6 py-2.5 text-sm font-bold text-white"
          style={{ background: `linear-gradient(135deg,${cor},${cor}bb)` }}>
          Voltar à loja
        </Link>
      </div>
    );
  }

  // ── Submissão final ──────────────────────────────────────────────────────
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
            produtoId: i.produtoId,
            varianteId: i.varianteId,
            titulo: i.titulo,
            precoUnitario: i.precoUnitario,
            quantidade: i.quantidade,
            imagemUrl: i.imagemUrl,
          })),
          clienteEmail: email,
          clienteNome: nome,
          clienteTelefone: telefone,
          morada,
          metodoPagamento,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "Erro ao processar o pedido");
      limpar();
      router.push(data.redirectUrl);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
      setASubmeter(false);
    }
  }

  // ── Layout ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Link href={`/loja/${params.subdominio}`} className="hover:text-slate-700 transition-colors">Loja</Link>
          <span>›</span>
          <Link href={`/loja/${params.subdominio}`} className="hover:text-slate-700 transition-colors" onClick={() => window.history.back()}>Carrinho</Link>
          <span>›</span>
          <span className="text-slate-700 font-medium">Checkout</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">

          {/* ── Coluna esquerda — formulário ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <Stepper atual={passo} />

              {/* PASSO 0 — Informações pessoais */}
              {passo === 0 && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-slate-800 mb-4">Informações de contacto</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <Campo label="Nome completo" name="nome" placeholder="João Silva" required value={nome} onChange={setNome} />
                    <Campo label="Email" name="email" type="email" placeholder="email@exemplo.com" required value={email} onChange={setEmail} />
                    <Campo label="Telemóvel" name="telefone" type="tel" placeholder="+351 910 000 000" value={telefone} onChange={setTelefone} half />
                  </div>
                  <button
                    onClick={() => { if (!nome || !email) { setErro("Preencha o nome e email."); return; } setErro(""); setPasso(1); }}
                    className="mt-4 w-full rounded-xl py-3.5 font-bold text-white text-sm hover:opacity-90 active:scale-95 transition-all"
                    style={{ background: `linear-gradient(135deg,${cor},${cor}bb)` }}>
                    Continuar para entrega →
                  </button>
                </div>
              )}

              {/* PASSO 1 — Morada de entrega */}
              {passo === 1 && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-slate-800 mb-4">Morada de entrega</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <Campo label="Rua / Avenida" name="rua" placeholder="Rua de Exemplo, 123" required
                      value={morada.rua} onChange={(v) => setMorada(m => ({ ...m, rua: v }))} />
                    <Campo label="Cidade" name="cidade" placeholder="Lisboa" required half
                      value={morada.cidade} onChange={(v) => setMorada(m => ({ ...m, cidade: v }))} />
                    <Campo label="Código postal" name="codigoPostal" placeholder="1000-001" required half
                      value={morada.codigoPostal} onChange={(v) => setMorada(m => ({ ...m, codigoPostal: v }))} />
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">País</label>
                      <select value={morada.pais} onChange={(e) => setMorada(m => ({ ...m, pais: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25">
                        {["Portugal", "Angola", "Brasil", "Moçambique", "Cabo Verde", "São Tomé e Príncipe", "Guiné-Bissau", "Timor-Leste", "Outro"].map(p => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
                    🚚 O prazo e custo de entrega são definidos pelo lojista e serão confirmados por email após o pedido.
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button onClick={() => { setErro(""); setPasso(0); }}
                      className="flex-1 rounded-xl py-3 font-semibold text-slate-600 text-sm border border-slate-200 hover:bg-slate-50 transition-colors">
                      ← Voltar
                    </button>
                    <button
                      onClick={() => { if (!morada.rua || !morada.cidade) { setErro("Preencha a rua e cidade."); return; } setErro(""); setPasso(2); }}
                      className="flex-[2] rounded-xl py-3.5 font-bold text-white text-sm hover:opacity-90 active:scale-95 transition-all"
                      style={{ background: `linear-gradient(135deg,${cor},${cor}bb)` }}>
                      Continuar para pagamento →
                    </button>
                  </div>
                </div>
              )}

              {/* PASSO 2 — Método de pagamento */}
              {passo === 2 && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-slate-800 mb-4">Método de pagamento</h2>
                  <div className="space-y-2">
                    {METODOS.map((m) => {
                      const ativo = metodoPagamento === m.id;
                      return (
                        <button key={m.id} type="button" onClick={() => setMetodoPagamento(m.id)}
                          className="w-full flex items-center gap-4 rounded-xl border-2 px-4 py-3.5 text-left transition-all"
                          style={{
                            borderColor: ativo ? cor : "#e2e8f0",
                            background: ativo ? `${cor}08` : "#fff",
                          }}>
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                            {m.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                              {m.label}
                              {m.paisFlag && <span className="text-base">{m.paisFlag}</span>}
                            </p>
                            <p className="text-xs text-slate-400">{m.sub}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                            ${ativo ? "border-0" : "border-slate-300"}`}
                            style={ativo ? { background: cor } : {}}>
                            {ativo && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Campo extra para MB WAY */}
                  {metodoPagamento === "mbway" && (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
                      📱 Após confirmar, receberá uma notificação no seu telemóvel para aprovar o pagamento.
                    </div>
                  )}
                  {metodoPagamento === "multibanco" && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
                      🏧 Receberá uma referência Multibanco por email. Tem 3 dias para pagar em qualquer caixa ATM.
                    </div>
                  )}
                  {metodoPagamento === "multicaixa" && (
                    <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-3 text-xs text-yellow-800">
                      📲 Após confirmar, receberá as instruções de pagamento via Multicaixa Express.
                    </div>
                  )}

                  {erro && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{erro}</div>
                  )}

                  <div className="flex gap-3 mt-4">
                    <button onClick={() => { setErro(""); setPasso(1); }}
                      className="flex-1 rounded-xl py-3 font-semibold text-slate-600 text-sm border border-slate-200 hover:bg-slate-50 transition-colors">
                      ← Voltar
                    </button>
                    <button onClick={handlePagar} disabled={aSubmeter}
                      className="flex-[2] rounded-xl py-3.5 font-bold text-white text-sm hover:opacity-90 active:scale-95 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                      style={{ background: `linear-gradient(135deg,${cor},${cor}bb)` }}>
                      {aSubmeter
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A processar…</>
                        : `Confirmar pedido · ${formatarPreco(total, "EUR")}`}
                    </button>
                  </div>

                  {/* Selos de segurança */}
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <span>🔒</span> SSL 256-bit
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <span>✓</span> Dados protegidos
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <span>↩️</span> 14 dias devolução
                    </div>
                  </div>
                </div>
              )}

              {/* Erro global */}
              {erro && passo !== 2 && (
                <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{erro}</div>
              )}
            </div>
          </div>

          {/* ── Coluna direita — resumo ── */}
          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-bold text-slate-800 mb-4">Resumo do pedido</h3>

              {/* Itens */}
              <div className="space-y-3 mb-4">
                {itens.map((item) => (
                  <div key={`${item.produtoId}-${item.varianteId}`} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden">
                      {item.imagemUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imagemUrl} alt={item.titulo} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-black"
                          style={{ color: cor }}>{item.titulo.charAt(0)}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.titulo}</p>
                      <p className="text-xs text-slate-400">Qtd. {item.quantidade}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-800 flex-shrink-0">
                      {formatarPreco(item.precoUnitario * item.quantidade, "EUR")}
                    </span>
                  </div>
                ))}
              </div>

              {/* Linha separadora */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatarPreco(subtotal, "EUR")}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Envio</span>
                  <span className="text-green-600 font-medium">A calcular</span>
                </div>
              </div>

              <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between items-center">
                <span className="font-bold text-slate-800">Total</span>
                <span className="text-2xl font-black" style={{ color: cor }}>
                  {formatarPreco(total, "EUR")}
                </span>
              </div>
            </div>

            {/* Garantias */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
              {[
                { icon: "🔒", t: "Pagamento seguro", s: "Encriptação SSL em todos os dados" },
                { icon: "↩️", t: "Devolução gratuita", s: "14 dias sem questões" },
                { icon: "📦", t: "Envio pelo lojista", s: "Prazo confirmado por email" },
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
