"use client";

// Configurador ao vivo dos temas Alto Padrão: lê as variantes "A / B / C" como eixos
// (Cor/Tamanho, Metal/Pedra/Medida, Tecido/Lugares), mostra o preço da combinação escolhida
// e, sem fotografia, desenha a peça na cor escolhida. Adiciona ao carrinho a variante real —
// o checkout recalcula o preço na BD, por isso nada aqui altera o valor cobrado.
import { useMemo, useState, type ReactNode } from "react";
import { useCartStore } from "@/store/cart-store";
import { formatarPreco } from "@/lib/moeda";
import { CONFIG_ALTO_PADRAO, type SlugAltoPadrao } from "@/lib/temas-alto-padrao";
import { corDaAmostra, linkContacto, partesDaVariante, type ProdutoAP } from "./util";
import { Anel, Peca, Sofa } from "./ilustracoes";

interface Props {
  slug: SlugAltoPadrao;
  produto: ProdutoAP;
  moeda: string;
  subdominio: string;
  telefoneWA: string | null;
  painel?: ReactNode;    // fotografia do produto; sem ela usa-se a ilustração do tema
  cabecalho?: ReactNode; // acima do preço
  rodape?: ReactNode;    // abaixo dos botões
}

const ESTILOS: Record<SlugAltoPadrao, {
  grade: string; painel: string; coluna: string; preco: string; rotulo: string;
  amostra: string; amostraSel: string; opcoes: string; opcao: string; opcaoSel: string;
  principal: string; secundario: string; campo: string; nota: string;
}> = {
  "maison-ndala": {
    grade: "grid md:grid-cols-2 border-b border-[#E2DED5]",
    painel: "relative aspect-[4/5] md:aspect-auto md:min-h-[640px] bg-[#ECE8E0] flex items-center justify-center overflow-hidden",
    coluna: "px-6 py-10 md:px-14 md:py-16 space-y-7",
    preco: "text-lg tracking-wide text-[#141414]",
    rotulo: "flex justify-between text-[11px] uppercase tracking-[0.2em] text-[#6B6760]",
    amostra: "h-7 w-7 rounded-full ring-1 ring-black/10 transition",
    amostraSel: "ring-1 ring-offset-2 ring-offset-[#F8F6F1] ring-[#141414]",
    opcoes: "flex flex-wrap gap-2",
    opcao: "min-w-[56px] h-11 px-3 border border-[#E2DED5] text-sm text-[#141414] transition hover:border-[#141414]",
    opcaoSel: "!bg-[#141414] !text-[#F8F6F1] !border-[#141414]",
    principal: "w-full h-14 bg-[#141414] text-[#F8F6F1] text-xs uppercase tracking-[0.25em] transition hover:bg-[#2433A0] disabled:opacity-40 disabled:hover:bg-[#141414]",
    secundario: "w-full h-12 border border-[#141414] text-[#141414] text-xs uppercase tracking-[0.25em]",
    campo: "",
    nota: "text-xs text-[#6B6760]",
  },
  aurea: {
    grade: "grid lg:grid-cols-[1.1fr_1fr] border border-[#D4B26A33]",
    painel: "relative min-h-[380px] lg:min-h-[620px] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_42%,#1F5544_0%,#0F2A22_62%,#0B1F19_100%)]",
    coluna: "bg-[#0F2A22] p-7 lg:p-12 space-y-6",
    preco: "[font-family:var(--ap-titulo)] text-4xl text-[#F1E9D8]",
    rotulo: "flex justify-between text-[10px] uppercase tracking-[0.25em] text-[#9DB3A8]",
    amostra: "",
    amostraSel: "",
    opcoes: "flex flex-wrap gap-2",
    opcao: "inline-flex items-center gap-2 border border-[#D4B26A33] px-3.5 py-2 text-xs text-[#C9D6CF] transition hover:border-[#D4B26A]",
    opcaoSel: "!border-[#D4B26A] !bg-[#D4B26A1A] !text-[#F1E9D8]",
    principal: "w-full h-14 bg-[#C9A45C] text-[#0F2A22] text-xs font-semibold uppercase tracking-[0.25em] transition hover:bg-[#D9B874]",
    secundario: "w-full h-12 border border-[#D4B26A66] text-[#D4B26A] text-xs uppercase tracking-[0.25em] transition hover:bg-[#D4B26A14] disabled:opacity-40",
    campo: "w-full bg-transparent border border-[#D4B26A33] px-4 py-3 text-sm text-[#F1E9D8] placeholder:text-[#9DB3A8]/60 outline-none focus:border-[#D4B26A]",
    nota: "text-xs text-[#9DB3A8]",
  },
  "casa-mussulo": {
    grade: "grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-14 items-start",
    painel: "relative rounded-[28px] bg-[#E6E6E1] min-h-[320px] lg:min-h-[520px] flex items-center justify-center overflow-hidden p-6",
    coluna: "space-y-6 lg:pt-4",
    preco: "[font-family:var(--ap-titulo)] text-2xl font-bold text-[#1D2522]",
    rotulo: "flex justify-between text-xs font-semibold text-[#1D2522]",
    amostra: "h-10 w-10 rounded-xl ring-1 ring-black/10 transition",
    amostraSel: "ring-2 ring-offset-2 ring-offset-[#F2F2EF] ring-[#1D2522]",
    opcoes: "grid grid-flow-col auto-cols-fr gap-1 rounded-full bg-[#E6E6E1] p-1",
    opcao: "rounded-full py-2.5 px-3 text-sm text-[#1D2522] transition",
    opcaoSel: "!bg-white shadow-sm font-semibold",
    principal: "w-full h-14 rounded-full bg-[#1D2522] text-[#F2F2EF] text-sm font-semibold transition hover:bg-[#1F6F78] disabled:opacity-40 disabled:hover:bg-[#1D2522]",
    secundario: "w-full h-12 rounded-full border border-[#1D2522] text-[#1D2522] text-sm font-semibold",
    campo: "",
    nota: "text-xs text-[#66706B]",
  },
};

export function Configurador({ slug, produto, moeda, subdominio, telefoneWA, painel, cabecalho, rodape }: Props) {
  const cfg = CONFIG_ALTO_PADRAO[slug];
  const e = ESTILOS[slug];
  const adicionar = useCartStore((s) => s.adicionar);
  const [adicionado, setAdicionado] = useState(false);
  const [gravacao, setGravacao] = useState("");

  const partes = useMemo(() => produto.variantes.map((v) => partesDaVariante(v.nomeOpcao)), [produto.variantes]);
  const nEixos = partes.reduce((m, p) => Math.max(m, p.length), 0);
  const valores = useMemo(
    () => Array.from({ length: nEixos }, (_, i) => Array.from(new Set(partes.map((p) => p[i]).filter(Boolean)))),
    [partes, nEixos],
  );

  const [sel, setSel] = useState<string[]>(() => {
    const k = produto.variantes.findIndex((v) => v.stock > 0);
    return partes[k >= 0 ? k : 0] ?? [];
  });

  const indice = partes.findIndex((p) => p.length === sel.length && p.every((x, i) => x === sel[i]));
  const variante = indice >= 0 ? produto.variantes[indice] : undefined;
  const preco = produto.preco + (variante?.precoExtra ?? 0);
  const semStock = produto.variantes.length > 0 ? !variante || variante.stock <= 0 : produto.stock <= 0;

  function escolher(eixo: number, valor: string) {
    let alvo = [...sel];
    alvo[eixo] = valor;
    const exacta = partes.findIndex((p) => p.length === alvo.length && p.every((x, i) => x === alvo[i]));
    if (exacta < 0) {
      // Não há essa combinação: fica a variante com este valor mais parecida com a escolha actual.
      let melhor = -1;
      let pontos = -1;
      partes.forEach((p, k) => {
        if (p[eixo] !== valor) return;
        const s = p.reduce((acc, x, j) => acc + (x === alvo[j] ? 1 : 0), 0) + (produto.variantes[k].stock > 0 ? 0.5 : 0);
        if (s > pontos) { pontos = s; melhor = k; }
      });
      if (melhor >= 0) alvo = partes[melhor];
    }
    setSel(alvo);
  }

  function esgotado(eixo: number, valor: string) {
    const candidatas = partes
      .map((p, k) => ({ p, k }))
      .filter(({ p }) => p[eixo] === valor && p.every((x, j) => j === eixo || x === sel[j]));
    return candidatas.length > 0 && candidatas.every(({ k }) => produto.variantes[k].stock <= 0);
  }

  function handleAdicionar() {
    adicionar({
      produtoId: produto.id,
      varianteId: variante?.id,
      titulo: variante ? `${produto.titulo} (${variante.nomeOpcao})` : produto.titulo,
      imagemUrl: produto.imagemUrl,
      precoUnitario: preco,
      quantidade: 1,
    });
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 1400);
  }

  function reservarConcierge() {
    if (!cfg.concierge) return;
    const linhas = [
      cfg.concierge.mensagem,
      `${produto.titulo}${sel.length ? ` — ${sel.join(" · ")}` : ""}`,
      gravacao.trim() ? `${cfg.gravacao?.rotulo ?? "Gravação"}: "${gravacao.trim()}"` : "",
      `Preço: ${formatarPreco(preco, moeda)}`,
      window.location.href,
    ].filter(Boolean);
    const url = linkContacto(telefoneWA, linhas.join("\n"), subdominio);
    if (url.startsWith("http")) window.open(url, "_blank", "noopener,noreferrer");
    else window.location.href = url;
  }

  // Ilustração que acompanha a escolha quando não há fotografia
  const cor0 = sel[0] ? corDaAmostra(sel[0], cfg.amostras) : null;
  const cor1 = sel[1] ? corDaAmostra(sel[1], cfg.amostras) : null;
  const lugares = Number(sel.join(" ").match(/(\d+)\s*lugar/i)?.[1] ?? 3);
  const ilustracao =
    slug === "aurea" ? <Anel uid={`cfg-${produto.id}`} metal={cor0 ?? undefined} pedra={cor1 ?? undefined} className="w-56 lg:w-72 drop-shadow-2xl" />
    : slug === "casa-mussulo" ? <Sofa tecido={cor0 ?? undefined} lugares={lugares} className="w-full max-w-lg transition-all duration-500" />
    : <Peca cor={cor0 ?? undefined} className="w-48 md:w-64" />;

  return (
    <div className={e.grade}>
      <div className={e.painel}>{painel ?? ilustracao}</div>

      <div className={e.coluna}>
        {cabecalho}

        <p className={e.preco}>{formatarPreco(preco, moeda)}</p>

        {valores.map((lista, i) => {
          const comCor = slug !== "aurea" && lista.every((v) => corDaAmostra(v, cfg.amostras));
          return (
            <div key={i} className="space-y-3">
              <div className={e.rotulo}>
                <span>{cfg.eixos[i] ?? `Opção ${i + 1}`}</span>
                <span className="opacity-80">{sel[i]}</span>
              </div>
              {comCor ? (
                <div className="flex flex-wrap gap-3">
                  {lista.map((v) => (
                    <button
                      key={v}
                      type="button"
                      title={v}
                      aria-label={v}
                      aria-pressed={sel[i] === v}
                      onClick={() => escolher(i, v)}
                      className={`${e.amostra} ${sel[i] === v ? e.amostraSel : ""} ${esgotado(i, v) ? "opacity-40" : ""}`}
                      style={{ background: corDaAmostra(v, cfg.amostras)! }}
                    />
                  ))}
                </div>
              ) : (
                <div className={e.opcoes}>
                  {lista.map((v) => {
                    const cor = slug === "aurea" ? corDaAmostra(v, cfg.amostras) : null;
                    return (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={sel[i] === v}
                        onClick={() => escolher(i, v)}
                        className={`${e.opcao} ${sel[i] === v ? e.opcaoSel : ""} ${esgotado(i, v) ? "line-through opacity-50" : ""}`}
                      >
                        {cor && <span className="h-3 w-3 rounded-full ring-1 ring-white/20" style={{ background: cor }} />}
                        {v}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {cfg.gravacao && (
          <div className="space-y-3">
            <label htmlFor={`gravacao-${produto.id}`} className={e.rotulo}>
              <span>{cfg.gravacao.rotulo}</span>
            </label>
            <input
              id={`gravacao-${produto.id}`}
              value={gravacao}
              maxLength={40}
              onChange={(ev) => setGravacao(ev.target.value)}
              placeholder={cfg.gravacao.placeholder}
              className={e.campo}
            />
            <p className={e.nota}>{cfg.gravacao.nota}</p>
          </div>
        )}

        <div className="space-y-3 pt-1">
          {cfg.concierge ? (
            <>
              <button type="button" onClick={reservarConcierge} className={e.principal}>
                {cfg.concierge.botao}
              </button>
              <button type="button" onClick={handleAdicionar} disabled={semStock} className={e.secundario}>
                {semStock ? "Esgotado" : adicionado ? "Adicionado ✓" : cfg.textos.adicionar}
              </button>
            </>
          ) : (
            <button type="button" onClick={handleAdicionar} disabled={semStock} className={e.principal}>
              {semStock ? "Esgotado" : adicionado ? "Adicionado ✓" : cfg.textos.adicionar}
            </button>
          )}
        </div>

        {rodape}
      </div>
    </div>
  );
}
