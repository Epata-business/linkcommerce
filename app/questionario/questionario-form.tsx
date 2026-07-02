"use client";

import { useState } from "react";
import { submeterQuestionario } from "./action";

// ── tipos ─────────────────────────────────────────────────────────────────────
type Pergunta =
  | { tipo: "escolha_unica"; id: string; pergunta: string; sub?: string; opcoes: string[] }
  | { tipo: "escolha_multipla"; id: string; pergunta: string; sub?: string; opcoes: string[]; max?: number }
  | { tipo: "texto"; id: string; pergunta: string; sub?: string; placeholder: string; multiline?: boolean }
  | { tipo: "contacto"; id: string; pergunta: string; sub?: string };

const PERGUNTAS: Pergunta[] = [
  {
    tipo: "escolha_unica", id: "pais", pergunta: "Em que país vende?",
    sub: "Ou onde pretende vender.",
    opcoes: ["Portugal 🇵🇹", "Angola 🇦🇴", "Brasil 🇧🇷", "Moçambique 🇲🇿", "Cabo Verde 🇨🇻", "Outro"],
  },
  {
    tipo: "escolha_unica", id: "setor", pergunta: "Qual é o seu setor?",
    opcoes: ["Roupa & Moda", "Calçado", "Cosméticos & Beleza", "Alimentação", "Eletrónica", "Artesanato", "Serviços", "Outro"],
  },
  {
    tipo: "escolha_unica", id: "numProdutos", pergunta: "Quantos produtos vende atualmente?",
    opcoes: ["Ainda não vendo", "1–20", "20–100", "100–500", "Mais de 500"],
  },
  {
    tipo: "escolha_multipla", id: "comoVende", pergunta: "Como vende hoje?",
    sub: "Pode escolher várias.",
    opcoes: ["Instagram", "Facebook", "WhatsApp", "Loja física", "Marketplace (OLX, etc.)", "Shopify / WooCommerce", "Ainda não vendo online", "Outro"],
  },
  {
    tipo: "escolha_multipla", id: "dificuldades", pergunta: "Quais são as suas maiores dificuldades?",
    sub: "Pode escolher várias.",
    opcoes: ["Receber pagamentos", "Controlar stock", "Gerir encomendas", "Criar loja online", "Marketing e publicidade", "Gerir entregas", "Gestão de clientes", "Criar descrições de produtos", "Outro"],
  },
  {
    tipo: "escolha_multipla", id: "indispensavel", pergunta: "O que considera indispensável numa plataforma?",
    sub: "Escolha até 5.",
    max: 5,
    opcoes: ["Loja online", "POS (venda presencial)", "App móvel", "Gestão de stock", "Domínio próprio", "WhatsApp integrado", "Instagram Shopping", "Email Marketing", "IA para criar descrições", "Faturas automáticas", "Cupões e descontos", "Relatórios de vendas", "Multiutilizador", "Produtos digitais / Serviços"],
  },
  {
    tipo: "escolha_multipla", id: "pagamentos", pergunta: "Que métodos de pagamento quer aceitar?",
    sub: "Pode escolher vários.",
    opcoes: ["Cartão de crédito/débito", "MB WAY 🇵🇹", "Multicaixa Express 🇦🇴", "Referência Multibanco 🇵🇹", "PayPal", "Apple Pay", "Google Pay", "Transferência bancária", "Dinheiro na entrega", "Outro"],
  },
  {
    tipo: "escolha_multipla", id: "ia", pergunta: "Quais funcionalidades de IA usaria?",
    sub: "Pode escolher várias.",
    opcoes: ["Gerar descrições de produto", "Criar posts para Instagram", "Criar campanhas de email", "Responder clientes automaticamente", "Sugerir preços", "Analisar vendas", "Traduzir produtos", "Criar anúncios"],
  },
  {
    tipo: "escolha_unica", id: "dispostoAPagar", pergunta: "Quanto estaria disposto a pagar por mês?",
    sub: "Por uma plataforma completa como esta.",
    opcoes: ["Apenas plano gratuito", "Até 10€/mês", "10€–20€/mês", "20€–50€/mês", "Mais de 50€/mês"],
  },
  {
    tipo: "escolha_multipla", id: "mudancaPlataforma", pergunta: "O que o faria mudar de plataforma?",
    sub: "Pode escolher vários.",
    opcoes: ["Preço mais baixo", "Mais facilidade de uso", "Melhor apoio ao cliente", "IA integrada", "POS físico", "Mais métodos de pagamento", "Design mais bonito", "Integração com redes sociais"],
  },
  {
    tipo: "texto", id: "oQueFalta", pergunta: "O que falta nas plataformas atuais?",
    sub: "Resposta livre — seja honesto!",
    placeholder: "Ex: Nunca encontrei uma plataforma que integre POS com loja online de forma simples…",
    multiline: true,
  },
  {
    tipo: "escolha_unica", id: "testarGratis", pergunta: "Gostaria de testar o LinkCommerce gratuitamente?",
    sub: "Sem cartão de crédito. Cancela quando quiser.",
    opcoes: ["Sim, quero testar! 🚀", "Talvez mais tarde", "Não tenho interesse"],
  },
  {
    tipo: "contacto", id: "contacto", pergunta: "Ótimo! Como podemos contactá-lo?",
    sub: "Só para lhe enviar acesso antecipado. Sem spam.",
  },
];

// ── componente ────────────────────────────────────────────────────────────────
export function QuestionarioForm() {
  const [passo, setPasso] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string | string[]>>({});
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  const perguntasVisiveis = PERGUNTAS.filter(p => {
    if (p.id === "contacto") return respostas["testarGratis"] === "Sim, quero testar! 🚀";
    return true;
  });
  const total = perguntasVisiveis.length;
  const pergunta = perguntasVisiveis[passo];
  const progresso = Math.round(((passo) / total) * 100);

  function getResposta(id: string): string | string[] {
    return respostas[id] ?? (PERGUNTAS.find(p => p.id === id && (p.tipo === "escolha_multipla")) ? [] : "");
  }

  function setResposta(id: string, valor: string | string[]) {
    setRespostas(r => ({ ...r, [id]: valor }));
  }

  function toggleMultipla(id: string, opcao: string, max?: number) {
    const atual = (getResposta(id) as string[]);
    if (atual.includes(opcao)) {
      setResposta(id, atual.filter(o => o !== opcao));
    } else {
      if (max && atual.length >= max) return;
      setResposta(id, [...atual, opcao]);
    }
  }

  function podeAvancar(): boolean {
    if (!pergunta) return false;
    if (pergunta.tipo === "contacto") return !!email;
    const r = getResposta(pergunta.id);
    if (pergunta.tipo === "texto") return true; // opcional
    if (pergunta.tipo === "escolha_unica") return !!r;
    if (pergunta.tipo === "escolha_multipla") return (r as string[]).length > 0;
    return true;
  }

  function avancar() {
    if (passo < total - 1) setPasso(p => p + 1);
    else handleEnviar();
  }

  async function handleEnviar() {
    setEnviando(true);
    setErro("");
    const fd = new FormData();
    Object.entries(respostas).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach(item => fd.append(k, item));
      else fd.append(k, v);
    });
    fd.set("nome", nome);
    fd.set("email", email);
    fd.set("telefone", telefone);
    const res = await submeterQuestionario(null, fd);
    if (res?.sucesso) setEnviado(true);
    else { setErro(res?.erro ?? "Erro ao enviar."); setEnviando(false); }
  }

  // ── ecrã final ───────────────────────────────────────────────────────────
  if (enviado) {
    return (
      <div className="text-center py-16 px-4">
        <div className="text-7xl mb-6 animate-bounce">🙏</div>
        <h2 className="text-3xl font-black text-white mb-3">Obrigado!</h2>
        <p className="text-slate-300 text-lg max-w-sm mx-auto mb-8">
          As suas respostas vão moldar o LinkCommerce. Entraremos em contacto em breve.
        </p>
        <a href="https://linkcommerce.app"
          className="inline-block rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-8 py-4 text-base font-bold text-white hover:opacity-90 transition-opacity">
          Conhecer o LinkCommerce →
        </a>
      </div>
    );
  }

  if (!pergunta) return null;

  // ── layout por pergunta ──────────────────────────────────────────────────
  return (
    <div className="min-h-[70vh] flex flex-col">
      {/* Progresso */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span className="font-medium text-slate-400">{passo + 1} / {total}</span>
          <span>{progresso}%</span>
        </div>
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
            style={{ width: `${progresso + (100 / total)}%` }} />
        </div>
      </div>

      {/* Pergunta */}
      <div className="flex-1">
        <div className="mb-7">
          <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug">{pergunta.pergunta}</h2>
          {pergunta.sub && <p className="text-slate-400 mt-2 text-sm">{pergunta.sub}</p>}
        </div>

        {/* Escolha única */}
        {pergunta.tipo === "escolha_unica" && (
          <div className="space-y-2.5">
            {pergunta.opcoes.map((opcao, i) => {
              const ativo = getResposta(pergunta.id) === opcao;
              return (
                <button key={opcao} type="button"
                  onClick={() => { setResposta(pergunta.id, opcao); setTimeout(avancar, 280); }}
                  className={`w-full flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all active:scale-98
                    ${ativo
                      ? "border-blue-500 bg-blue-500/20 text-white"
                      : "border-white/10 bg-white/5 text-slate-200 hover:border-white/30 hover:bg-white/10"
                    }`}>
                  <span className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-bold shrink-0
                    ${ativo ? "border-blue-500 bg-blue-500 text-white" : "border-white/20 text-slate-400"}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="font-medium text-sm sm:text-base">{opcao}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Escolha múltipla */}
        {pergunta.tipo === "escolha_multipla" && (
          <>
            {pergunta.max && (
              <p className="text-xs text-slate-500 mb-3">
                {(getResposta(pergunta.id) as string[]).length}/{pergunta.max} selecionados
              </p>
            )}
            <div className="space-y-2.5">
              {pergunta.opcoes.map((opcao, i) => {
                const selecionadas = getResposta(pergunta.id) as string[];
                const ativo = selecionadas.includes(opcao);
                const bloqueado = !!pergunta.max && selecionadas.length >= pergunta.max && !ativo;
                return (
                  <button key={opcao} type="button"
                    onClick={() => !bloqueado && toggleMultipla(pergunta.id, opcao, pergunta.max)}
                    className={`w-full flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all
                      ${ativo ? "border-blue-500 bg-blue-500/20 text-white"
                        : bloqueado ? "border-white/5 bg-white/3 text-slate-600 cursor-not-allowed"
                        : "border-white/10 bg-white/5 text-slate-200 hover:border-white/30 hover:bg-white/10"
                      }`}>
                    <span className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-bold shrink-0
                      ${ativo ? "border-blue-500 bg-blue-500 text-white" : "border-white/20 text-slate-400"}`}>
                      {ativo ? "✓" : String.fromCharCode(65 + i)}
                    </span>
                    <span className="font-medium text-sm sm:text-base">{opcao}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Texto livre */}
        {pergunta.tipo === "texto" && (
          <div>
            {pergunta.multiline ? (
              <textarea
                rows={4}
                placeholder={pergunta.placeholder}
                value={(getResposta(pergunta.id) as string) ?? ""}
                onChange={e => setResposta(pergunta.id, e.target.value)}
                className="w-full rounded-2xl border-2 border-white/15 bg-white/8 px-5 py-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 transition-all resize-none"
              />
            ) : (
              <input
                placeholder={pergunta.placeholder}
                value={(getResposta(pergunta.id) as string) ?? ""}
                onChange={e => setResposta(pergunta.id, e.target.value)}
                className="w-full rounded-2xl border-2 border-white/15 bg-white/8 px-5 py-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 transition-all"
              />
            )}
          </div>
        )}

        {/* Contacto */}
        {pergunta.tipo === "contacto" && (
          <div className="space-y-3">
            <input placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)}
              className="w-full rounded-2xl border-2 border-white/15 bg-white/8 px-5 py-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 transition-all" />
            <input placeholder="Email *" type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full rounded-2xl border-2 border-white/15 bg-white/8 px-5 py-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 transition-all" />
            <input placeholder="WhatsApp / Telefone (opcional)" value={telefone} onChange={e => setTelefone(e.target.value)}
              className="w-full rounded-2xl border-2 border-white/15 bg-white/8 px-5 py-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/60 transition-all" />
          </div>
        )}
      </div>

      {/* Erro */}
      {erro && (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {erro}
        </div>
      )}

      {/* Botões de navegação (para múltipla e texto) */}
      {(pergunta.tipo !== "escolha_unica") && (
        <div className="mt-7 flex gap-3">
          {passo > 0 && (
            <button type="button" onClick={() => setPasso(p => p - 1)}
              className="rounded-2xl border border-white/10 px-5 py-3.5 text-sm font-semibold text-slate-400 hover:bg-white/5 transition-colors">
              ←
            </button>
          )}
          <button type="button" onClick={avancar} disabled={!podeAvancar() || enviando}
            className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 py-3.5 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
            {enviando
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />A enviar…</>
              : passo === total - 1 ? "Enviar respostas ✓" : "Continuar →"
            }
          </button>
        </div>
      )}

      {/* Voltar para escolha única */}
      {pergunta.tipo === "escolha_unica" && passo > 0 && (
        <button type="button" onClick={() => setPasso(p => p - 1)}
          className="mt-5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          ← Resposta anterior
        </button>
      )}

      <p className="text-center text-[11px] text-slate-700 mt-6">
        LinkCommerce · Sem spam · Dados usados apenas para melhorar o produto
      </p>
    </div>
  );
}
