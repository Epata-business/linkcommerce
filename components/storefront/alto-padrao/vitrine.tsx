// Página inicial da loja nos temas Alto Padrão (Maison Ndala, Áurea, Casa Mussulo).
// Chamada por app/loja/[subdominio]/page.tsx quando o tema activo é um destes.
/* eslint-disable @next/next/no-img-element -- imagens de produto vêm de vários domínios */
import { prisma } from "@/lib/prisma";
import { CONFIG_ALTO_PADRAO, type SlugAltoPadrao } from "@/lib/temas-alto-padrao";
import { Ambiente } from "./ambiente";
import { Anel, Peca, Trelica } from "./ilustracoes";
import { BlocoConcierge, BlocoProva, BlocoServico, CartaoAurea, CartaoMussulo, CartaoNdala, DestaquesAurea } from "./blocos";
import { preencher, temImagem, type LojaAP, type ProdutoAP } from "./util";

const NOVO_DIAS = 30;

export async function VitrineAltoPadrao({ slug, lojaId, subdominio, query }: { slug: SlugAltoPadrao; lojaId: string; subdominio: string; query: string }) {
  const loja = await prisma.loja.findUnique({
    where: { id: lojaId },
    select: {
      nome: true, moeda: true, telefoneWA: true, seoDescricao: true, logotipoUrl: true,
      produtos: {
        where: { ativo: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, titulo: true, descricao: true, preco: true, imagemUrl: true, stock: true, createdAt: true,
          variantes: { orderBy: { nomeOpcao: "asc" }, select: { id: true, nomeOpcao: true, precoExtra: true, stock: true } },
        },
      },
    },
  });
  if (!loja) return null;

  const limiteNovo = Date.now() - NOVO_DIAS * 24 * 60 * 60 * 1000;
  const produtos: ProdutoAP[] = loja.produtos.map((p) => ({
    id: p.id, titulo: p.titulo, descricao: p.descricao, preco: Number(p.preco), imagemUrl: p.imagemUrl, stock: p.stock,
    novo: p.createdAt.getTime() > limiteNovo,
    variantes: p.variantes.map((v) => ({ ...v, precoExtra: Number(v.precoExtra) })),
  }));

  return (
    <VitrineConteudo
      slug={slug}
      subdominio={subdominio}
      query={query}
      produtos={produtos}
      loja={{
        nome: loja.nome, moeda: loja.moeda ?? "EUR", telefoneWA: loja.telefoneWA?.replace(/\D/g, "") || null,
        descricao: loja.seoDescricao, logotipoUrl: loja.logotipoUrl,
      }}
    />
  );
}

interface ConteudoProps {
  slug: SlugAltoPadrao;
  subdominio: string;
  query: string;
  loja: LojaAP;
  produtos: ProdutoAP[];
}

export function VitrineConteudo(props: ConteudoProps) {
  const q = props.query.trim().toLowerCase();
  const produtos = q
    ? props.produtos.filter((p) => p.titulo.toLowerCase().includes(q) || (p.descricao?.toLowerCase().includes(q) ?? false))
    : props.produtos;
  const dados = { ...props, produtos };
  if (props.slug === "aurea") return <Aurea {...dados} />;
  if (props.slug === "casa-mussulo") return <Mussulo {...dados} />;
  return <Ndala {...dados} />;
}

function textosBase(slug: SlugAltoPadrao, loja: LojaAP) {
  const t = CONFIG_ALTO_PADRAO[slug].textos;
  const v = { loja: loja.nome, ano: new Date().getFullYear() };
  return { ...t, eyebrow: preencher(t.eyebrow, v), colecaoEyebrow: preencher(t.colecaoEyebrow, v), subtitulo: loja.descricao || t.subtitulo };
}

function AvisoPesquisa({ query, total, className }: { query: string; total: number; className?: string }) {
  if (!query.trim()) return null;
  return <p className={className}>{total} resultado{total === 1 ? "" : "s"} para “{query.trim()}”</p>;
}

// ── 01 · Maison Ndala ─────────────────────────────────────────────────────────
function Ndala({ subdominio, query, loja, produtos }: ConteudoProps) {
  const t = textosBase("maison-ndala", loja);
  const base = `/loja/${subdominio}`;
  const campanha = produtos.find((p) => temImagem(p.imagemUrl));

  return (
    <div className="bg-[#F8F6F1] text-[#141414]">
      <section className="grid border-b border-[#E2DED5] md:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:px-20 lg:py-24">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#6B6760]">{t.eyebrow}</p>
          <h1 className="mt-6 [font-family:var(--ap-titulo)] text-5xl leading-[1.04] sm:text-6xl lg:text-7xl">
            {t.titulo[0]}
            <br />
            <em className="text-[#2433A0]">{t.titulo[1]}</em> {t.titulo[2]}
          </h1>
          <p className="mt-8 max-w-md text-base font-light leading-relaxed text-[#6B6760]">{t.subtitulo}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="#colecao" className="inline-flex h-12 items-center bg-[#141414] px-8 text-xs uppercase tracking-[0.2em] text-[#F8F6F1] transition hover:bg-[#2433A0]">
              {t.ctaPrincipal}
            </a>
            <a href="#prova" className="inline-flex h-12 items-center border border-[#141414] px-8 text-xs uppercase tracking-[0.2em] transition hover:bg-[#141414] hover:text-[#F8F6F1]">
              {t.ctaSecundario}
            </a>
          </div>
        </div>
        <div className="relative min-h-[440px] overflow-hidden bg-[#2433A0] md:min-h-[640px]">
          {campanha ? (
            <img src={campanha.imagemUrl!} alt={campanha.titulo} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <>
              <Trelica uid="campanha" className="absolute inset-0 h-full w-full" />
              <Peca cor="#151515" forma="vestido" className="absolute bottom-0 left-1/2 w-[46%] -translate-x-1/2" />
            </>
          )}
          {campanha && <p className="absolute bottom-6 left-6 max-w-[240px] text-xs leading-relaxed text-white drop-shadow">{campanha.titulo}</p>}
        </div>
      </section>

      <section id="colecao" className="px-4 py-16 sm:px-10 lg:px-20 lg:py-24 scroll-mt-28">
        <div className="mb-10 flex items-end justify-between gap-4 border-b border-[#E2DED5] pb-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#6B6760]">{t.colecaoEyebrow}</p>
            <h2 className="mt-2 [font-family:var(--ap-titulo)] text-3xl sm:text-4xl">{t.colecaoTitulo}</h2>
          </div>
          <span className="shrink-0 whitespace-nowrap text-[11px] uppercase tracking-[0.2em] text-[#6B6760]">{preencher(t.verTodas, { n: produtos.length })}</span>
        </div>
        <AvisoPesquisa query={query} total={produtos.length} className="-mt-4 mb-8 text-sm text-[#6B6760]" />
        {produtos.length === 0 ? (
          <p className="py-20 text-center [font-family:var(--ap-titulo)] text-2xl italic text-[#6B6760]">{t.vazio}</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {produtos.map((p, i) => (
              <CartaoNdala key={p.id} p={p} i={i} href={`${base}/produto/${p.id}`} moeda={loja.moeda} />
            ))}
          </div>
        )}
      </section>

      <BlocoProva telefoneWA={loja.telefoneWA} subdominio={subdominio} />
    </div>
  );
}

// ── 02 · Áurea ────────────────────────────────────────────────────────────────
function Aurea({ subdominio, query, loja, produtos }: ConteudoProps) {
  const t = textosBase("aurea", loja);
  const base = `/loja/${subdominio}`;
  const configuravel = produtos.find((p) => p.variantes.length > 0) ?? produtos[0];

  return (
    <div className="bg-[#0F2A22] text-[#F1E9D8]">
      <section
        className="relative overflow-hidden px-6 pb-20 pt-16 text-center sm:pt-24"
        style={{ background: "radial-gradient(ellipse at 50% 62%, #1E5242 0%, #0F2A22 55%, #0B1F19 100%)" }}
      >
        <p className="text-[11px] uppercase tracking-[0.35em] text-[#D4B26A]">{t.eyebrow}</p>
        <h1 className="mx-auto mt-6 max-w-3xl [font-family:var(--ap-titulo)] text-5xl leading-[1.05] sm:text-7xl">
          {t.titulo[0]}
          <br />
          <em className="text-[#D4B26A]">{t.titulo[1]}</em> {t.titulo[2]}
        </h1>
        <Anel uid="hero" className="mx-auto mt-10 w-40 drop-shadow-2xl sm:w-52" />
        <p className="mx-auto mt-8 max-w-md text-sm leading-relaxed text-[#9DB3A8] sm:text-base">{t.subtitulo}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a
            href={configuravel ? `${base}/produto/${configuravel.id}` : "#colecao"}
            className="inline-flex h-12 items-center bg-[#C9A45C] px-8 text-xs font-semibold uppercase tracking-[0.25em] text-[#0F2A22] transition hover:bg-[#D9B874]"
          >
            {t.ctaPrincipal}
          </a>
          <a href="#colecao" className="inline-flex h-12 items-center border border-[#D4B26A66] px-8 text-xs uppercase tracking-[0.25em] text-[#D4B26A] transition hover:bg-[#D4B26A14]">
            {t.ctaSecundario}
          </a>
        </div>
      </section>

      <DestaquesAurea />

      <section id="colecao" className="px-4 py-20 sm:px-10 lg:px-16 scroll-mt-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#D4B26A]">{t.colecaoEyebrow}</p>
            <h2 className="mt-3 [font-family:var(--ap-titulo)] text-4xl sm:text-5xl">{t.colecaoTitulo}</h2>
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-[#9DB3A8]">{preencher(t.verTodas, { n: produtos.length })}</p>
            <AvisoPesquisa query={query} total={produtos.length} className="mt-3 text-sm text-[#9DB3A8]" />
          </div>
          {produtos.length === 0 ? (
            <p className="py-16 text-center [font-family:var(--ap-titulo)] text-2xl italic text-[#9DB3A8]">{t.vazio}</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
              {produtos.map((p, i) => (
                <CartaoAurea key={p.id} p={p} i={i} href={`${base}/produto/${p.id}`} moeda={loja.moeda} />
              ))}
            </div>
          )}
        </div>
      </section>

      <BlocoConcierge telefoneWA={loja.telefoneWA} subdominio={subdominio} />
    </div>
  );
}

// ── 03 · Casa Mussulo ─────────────────────────────────────────────────────────
function Mussulo({ subdominio, query, loja, produtos }: ConteudoProps) {
  const t = textosBase("casa-mussulo", loja);
  const base = `/loja/${subdominio}`;
  const pecas = produtos.filter((p) => p.stock > 0).slice(0, 3).map((p) => ({ id: p.id, titulo: p.titulo, preco: p.preco, href: `${base}/produto/${p.id}` }));

  return (
    <div className="bg-[#F2F2EF] text-[#1D2522]">
      <section id="ambiente" className="px-3 pt-3 sm:px-6 scroll-mt-28">
        <div className="overflow-hidden rounded-[28px] bg-[#E6E6E1] px-5 pt-10 sm:px-12 sm:pt-14">
          <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr] lg:items-end">
            <h1 className="max-w-4xl [font-family:var(--ap-titulo)] text-4xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              {t.titulo[0]} {t.titulo[1]} {t.titulo[2]}
            </h1>
            <div className="space-y-5 lg:pb-3">
              <p className="max-w-sm text-base leading-relaxed text-[#66706B]">{t.subtitulo}</p>
              <div className="flex flex-wrap gap-2">
                <a href="#colecao" className="inline-flex h-11 items-center rounded-full bg-[#1D2522] px-5 text-sm font-semibold text-[#F2F2EF] transition hover:bg-[#1F6F78]">
                  {t.ctaPrincipal}
                </a>
                <a href="#servico" className="inline-flex h-11 items-center rounded-full border border-[#1D2522] px-5 text-sm font-semibold transition hover:bg-[#1D2522] hover:text-[#F2F2EF]">
                  {t.ctaSecundario}
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <Ambiente pecas={pecas} moeda={loja.moeda} />
          </div>
        </div>
      </section>

      <section id="colecao" className="px-4 py-16 sm:px-8 lg:px-12 lg:py-24 scroll-mt-28">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1F6F78]">{t.colecaoEyebrow}</p>
            <h2 className="mt-2 [font-family:var(--ap-titulo)] text-3xl font-extrabold sm:text-4xl">{t.colecaoTitulo}</h2>
          </div>
          <span className="shrink-0 whitespace-nowrap text-sm text-[#66706B]">{preencher(t.verTodas, { n: produtos.length })}</span>
        </div>
        <AvisoPesquisa query={query} total={produtos.length} className="-mt-4 mb-8 text-sm text-[#66706B]" />
        {produtos.length === 0 ? (
          <p className="py-16 text-center text-lg text-[#66706B]">{t.vazio}</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {produtos.map((p, i) => (
              <CartaoMussulo key={p.id} p={p} i={i} href={`${base}/produto/${p.id}`} moeda={loja.moeda} />
            ))}
          </div>
        )}
      </section>

      <BlocoServico telefoneWA={loja.telefoneWA} subdominio={subdominio} />
    </div>
  );
}
