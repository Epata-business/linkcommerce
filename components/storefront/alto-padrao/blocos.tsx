// Blocos partilhados entre a página inicial (vitrine.tsx) e a página de produto (produto.tsx)
// dos temas Alto Padrão: cartões de produto e as secções próprias de cada tema.
/* eslint-disable @next/next/no-img-element -- imagens de produto vêm de vários domínios */
import Link from "next/link";
import { formatarPreco } from "@/lib/moeda";
import { CONFIG_ALTO_PADRAO } from "@/lib/temas-alto-padrao";
import { Marcacao } from "./marcacao";
import { Anel, FORMAS_PECA, Peca, Sofa } from "./ilustracoes";
import { linkContacto, temImagem, type ProdutoAP } from "./util";

export type CartaoAP = Pick<ProdutoAP, "id" | "titulo" | "preco" | "imagemUrl" | "stock" | "novo">;

const NDALA = CONFIG_ALTO_PADRAO["maison-ndala"];
const AUREA = CONFIG_ALTO_PADRAO.aurea;
const MUSSULO = CONFIG_ALTO_PADRAO["casa-mussulo"];

function etiqueta(p: CartaoAP) {
  if (p.stock <= 0) return "Esgotado";
  if (p.novo) return "Novo";
  if (p.stock <= 12) return `${p.stock} disponíveis`;
  return null;
}

// ── Maison Ndala ──────────────────────────────────────────────────────────────
// Peças das ilustrações do vídeo: vestido preto, kaftan branco, casaco terra, mala dourada.
const NDALA_PECAS = ["#151515", "#F4F1EA", "#7A3B22", "#C9A35C"];

export function CartaoNdala({ p, i, href, moeda }: { p: CartaoAP; i: number; href: string; moeda: string }) {
  const tag = etiqueta(p);
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden" style={{ background: NDALA.cores.paineis[i % 4] }}>
        {temImagem(p.imagemUrl) ? (
          <img src={p.imagemUrl} alt={p.titulo} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <Peca cor={NDALA_PECAS[i % 4]} forma={FORMAS_PECA[i % 4]} className="absolute inset-0 m-auto w-1/2" />
        )}
        {tag && (
          <span className="absolute left-3 top-3 bg-[#F8F6F1] px-2 py-1 text-[9px] uppercase tracking-[0.15em] text-[#141414]">{tag}</span>
        )}
        <span className="absolute inset-x-3 bottom-3 translate-y-2 bg-[#141414] py-3 text-center text-[10px] uppercase tracking-[0.25em] text-[#F8F6F1] opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {NDALA.textos.verPeca}
        </span>
      </div>
      <p className="mt-4 text-sm text-[#141414]">{p.titulo}</p>
      <p className="mt-1 text-xs text-[#6B6760]">{formatarPreco(p.preco, moeda)}</p>
    </Link>
  );
}

export function BlocoProva({ telefoneWA, subdominio }: { telefoneWA: string | null; subdominio: string }) {
  const m = NDALA.marcacao!;
  return (
    <section id="prova" className="px-4 pb-20 sm:px-10 lg:px-20 scroll-mt-28">
      <div className="grid gap-10 bg-[#111111] p-8 text-[#F8F6F1] sm:p-12 lg:grid-cols-2 lg:p-16">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">{m.eyebrow}</p>
          <h2 className="mt-4 [font-family:var(--ap-titulo)] text-4xl italic leading-tight lg:text-5xl">{m.titulo}</h2>
          <p className="mt-5 max-w-sm text-sm font-light leading-relaxed text-white/70">{m.texto}</p>
        </div>
        <Marcacao slug="maison-ndala" telefoneWA={telefoneWA} subdominio={subdominio} />
      </div>
    </section>
  );
}

// ── Áurea ─────────────────────────────────────────────────────────────────────
const AUREA_METAIS = ["#D4AF61", "#DADDE0", "#D99C8A"];
const AUREA_PEDRAS = ["#E6F2F7", "#2E9E6B", "#2F55B5"];

export function CartaoAurea({ p, i, href, moeda }: { p: CartaoAP; i: number; href: string; moeda: string }) {
  const tag = p.stock <= 0 ? "Esgotado" : p.novo ? "Novo" : null;
  return (
    <Link href={href} className="group block">
      <div
        className="relative aspect-square overflow-hidden border border-[#D4B26A1F] transition duration-500 group-hover:border-[#D4B26A66]"
        style={{ background: "radial-gradient(circle at 50% 42%, #1F5544 0%, #12352B 62%, #0D2720 100%)" }}
      >
        {temImagem(p.imagemUrl) ? (
          <img src={p.imagemUrl} alt={p.titulo} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <Anel uid={`c-${p.id}`} metal={AUREA_METAIS[i % 3]} pedra={AUREA_PEDRAS[i % 3]} className="absolute inset-0 m-auto w-1/2 transition duration-700 group-hover:scale-105" />
        )}
        {tag && <span className="absolute left-4 top-4 text-[9px] uppercase tracking-[0.3em] text-[#D4B26A]">{tag}</span>}
      </div>
      <p className="mt-4 [font-family:var(--ap-titulo)] text-xl text-[#F1E9D8]">{p.titulo}</p>
      <p className="mt-1 text-sm text-[#D4B26A]">{formatarPreco(p.preco, moeda)}</p>
    </Link>
  );
}

export function DestaquesAurea() {
  return (
    <section className="border-y border-[#D4B26A33]">
      <div className="mx-auto grid max-w-6xl divide-y divide-[#D4B26A26] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {(AUREA.destaques ?? []).map((d) => (
          <div key={d.titulo} className="px-6 py-8 sm:px-8 sm:py-10">
            <p className="[font-family:var(--ap-titulo)] text-xl text-[#F1E9D8]">{d.titulo}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#9DB3A8]">{d.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function BlocoConcierge({ telefoneWA, subdominio }: { telefoneWA: string | null; subdominio: string }) {
  const m = AUREA.marcacao!;
  return (
    <section id="concierge" className="px-4 pb-24 sm:px-10 lg:px-16 scroll-mt-28">
      <div className="mx-auto grid max-w-6xl gap-10 border border-[#D4B26A33] bg-[#0B1F19] p-8 sm:p-12 lg:grid-cols-2 lg:p-14">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#D4B26A]">{m.eyebrow}</p>
          <h2 className="mt-4 [font-family:var(--ap-titulo)] text-4xl leading-tight text-[#F1E9D8] lg:text-5xl">{m.titulo}</h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#9DB3A8]">{m.texto}</p>
        </div>
        <Marcacao slug="aurea" telefoneWA={telefoneWA} subdominio={subdominio} />
      </div>
    </section>
  );
}

// ── Casa Mussulo ──────────────────────────────────────────────────────────────
const MUSSULO_TECIDOS = ["#CFC3AA", "#1F6F78", "#8A4B2A", "#E8E1D3"];

export function CartaoMussulo({ p, i, href, moeda }: { p: CartaoAP; i: number; href: string; moeda: string }) {
  const tag = etiqueta(p);
  return (
    <Link href={href} className="group block">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[22px] bg-[#E6E6E1] p-5">
        {temImagem(p.imagemUrl) ? (
          <img src={p.imagemUrl} alt={p.titulo} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <Sofa tecido={MUSSULO_TECIDOS[i % 4]} lugares={2 + (i % 3)} className="w-full transition duration-500 group-hover:scale-105" />
        )}
        {tag && <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-[#1D2522]">{tag}</span>}
      </div>
      <p className="mt-4 [font-family:var(--ap-titulo)] text-sm font-bold text-[#1D2522]">{p.titulo}</p>
      <p className="mt-1 text-sm text-[#66706B]">{formatarPreco(p.preco, moeda)}</p>
    </Link>
  );
}

export function BlocoServico({ telefoneWA, subdominio }: { telefoneWA: string | null; subdominio: string }) {
  const s = MUSSULO.servico!;
  const href = linkContacto(telefoneWA, s.mensagem, subdominio);
  const externo = href.startsWith("http");
  return (
    <section id="servico" className="px-3 pb-16 sm:px-6 scroll-mt-28">
      <div className="rounded-[28px] bg-[#1D2522] px-6 py-12 text-[#F2F2EF] sm:px-12 lg:px-16 lg:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5AA3A8]">{s.eyebrow}</p>
        <h2 className="mt-4 max-w-3xl [font-family:var(--ap-titulo)] text-3xl font-extrabold leading-[1.05] sm:text-5xl">{s.titulo}</h2>
        <div className="mt-12 grid gap-8 border-t border-white/10 pt-10 sm:grid-cols-3">
          {s.passos.map((passo, i) => (
            <div key={passo.titulo}>
              <span className="[font-family:var(--ap-titulo)] text-2xl font-bold text-[#C58A3A]">{i + 1}</span>
              <p className="mt-3 font-semibold">{passo.titulo}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{passo.texto}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/60">{s.nota}</p>
          <a
            href={href}
            {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#F2F2EF] px-6 text-sm font-semibold text-[#1D2522] transition hover:bg-white"
          >
            {s.botao}
          </a>
        </div>
      </div>
    </section>
  );
}
