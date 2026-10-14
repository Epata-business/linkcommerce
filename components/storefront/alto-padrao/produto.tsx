// Página de produto nos temas Alto Padrão. Chamada por app/loja/[subdominio]/produto/[id]/page.tsx,
// que continua a tratar dos dados, do JSON-LD e das avaliações (passadas aqui já desenhadas).
/* eslint-disable @next/next/no-img-element -- imagens de produto vêm de vários domínios */
import Link from "next/link";
import type { ReactNode } from "react";
import type { SlugAltoPadrao } from "@/lib/temas-alto-padrao";
import { Configurador } from "./configurador";
import { BlocoConcierge, BlocoProva, BlocoServico, CartaoAurea, CartaoMussulo, CartaoNdala, DestaquesAurea, type CartaoAP } from "./blocos";
import { temImagem, type ProdutoAP } from "./util";

interface Props {
  slug: SlugAltoPadrao;
  subdominio: string;
  loja: { nome: string; moeda: string; telefoneWA: string | null };
  produto: ProdutoAP;
  relacionados: CartaoAP[];
  avaliacoes?: ReactNode;
}

export function ProdutoAltoPadrao(props: Props) {
  if (props.slug === "aurea") return <ProdutoAurea {...props} />;
  if (props.slug === "casa-mussulo") return <ProdutoMussulo {...props} />;
  return <ProdutoNdala {...props} />;
}

function Descricao({ texto, className }: { texto: string | null; className: string }) {
  if (!texto) return null;
  return <div className={className}>{texto.split("\n").map((l, i) => <p key={i}>{l}</p>)}</div>;
}

// ── 01 · Maison Ndala ─────────────────────────────────────────────────────────
function ProdutoNdala({ subdominio, loja, produto, relacionados, avaliacoes }: Props) {
  const base = `/loja/${subdominio}`;
  const edicao = produto.stock > 0 && produto.stock <= 12;
  return (
    <div className="bg-[#F8F6F1] text-[#141414]">
      <Configurador
        slug="maison-ndala"
        produto={produto}
        moeda={loja.moeda}
        subdominio={subdominio}
        telefoneWA={loja.telefoneWA}
        painel={temImagem(produto.imagemUrl) ? <img src={produto.imagemUrl} alt={produto.titulo} className="absolute inset-0 h-full w-full object-cover" /> : null}
        cabecalho={
          <div className="space-y-4">
            <nav className="text-[11px] uppercase tracking-[0.2em] text-[#6B6760]">
              <Link href={base} className="hover:text-[#141414]">{loja.nome}</Link>
              <span className="mx-2">/</span>
              <Link href={`${base}#colecao`} className="hover:text-[#141414]">Coleção</Link>
            </nav>
            <h1 className="[font-family:var(--ap-titulo)] text-4xl leading-tight lg:text-5xl">{produto.titulo}</h1>
            {edicao && <p className="text-[11px] uppercase tracking-[0.2em] text-[#2433A0]">Edição limitada · {produto.stock} disponíveis</p>}
          </div>
        }
        rodape={
          <div className="divide-y divide-[#E2DED5] border-y border-[#E2DED5] text-sm">
            {produto.descricao && (
              <details open className="group py-4">
                <summary className="flex cursor-pointer list-none justify-between text-[11px] uppercase tracking-[0.2em]">
                  Descrição <span className="transition group-open:rotate-45">+</span>
                </summary>
                <Descricao texto={produto.descricao} className="mt-3 space-y-2 font-light leading-relaxed text-[#6B6760]" />
              </details>
            )}
            <details className="group py-4">
              <summary className="flex cursor-pointer list-none justify-between text-[11px] uppercase tracking-[0.2em]">
                Entrega e devoluções <span className="transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 font-light leading-relaxed text-[#6B6760]">
                Consulte as condições de <Link href={`${base}/devolucoes`} className="underline underline-offset-4">entrega e devolução</Link> ou{" "}
                <a href="#prova" className="underline underline-offset-4">marque uma prova privada</a>.
              </p>
            </details>
          </div>
        }
      />

      {relacionados.length > 0 && (
        <section className="px-4 py-16 sm:px-10 lg:px-20">
          <h2 className="mb-10 border-b border-[#E2DED5] pb-5 [font-family:var(--ap-titulo)] text-3xl">Da mesma coleção</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {relacionados.map((p, i) => <CartaoNdala key={p.id} p={p} i={i} href={`${base}/produto/${p.id}`} moeda={loja.moeda} />)}
          </div>
        </section>
      )}

      <BlocoProva telefoneWA={loja.telefoneWA} subdominio={subdominio} />
      {avaliacoes}
    </div>
  );
}

// ── 02 · Áurea ────────────────────────────────────────────────────────────────
function ProdutoAurea({ subdominio, loja, produto, relacionados, avaliacoes }: Props) {
  const base = `/loja/${subdominio}`;
  return (
    <div className="bg-[#0F2A22] text-[#F1E9D8]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 lg:py-16">
        <Configurador
          slug="aurea"
          produto={produto}
          moeda={loja.moeda}
          subdominio={subdominio}
          telefoneWA={loja.telefoneWA}
          painel={temImagem(produto.imagemUrl) ? <img src={produto.imagemUrl} alt={produto.titulo} className="absolute inset-0 h-full w-full object-cover" /> : null}
          cabecalho={
            <div className="space-y-3">
              <nav className="text-[10px] uppercase tracking-[0.3em] text-[#9DB3A8]">
                <Link href={base} className="hover:text-[#D4B26A]">{loja.nome}</Link>
                <span className="mx-2">·</span>
                <Link href={`${base}#colecao`} className="hover:text-[#D4B26A]">Coleções</Link>
              </nav>
              <h1 className="[font-family:var(--ap-titulo)] text-4xl leading-tight lg:text-5xl">{produto.titulo}</h1>
            </div>
          }
          rodape={<Descricao texto={produto.descricao} className="space-y-2 border-t border-[#D4B26A26] pt-6 text-sm leading-relaxed text-[#9DB3A8]" />}
        />
      </div>

      <DestaquesAurea />

      {relacionados.length > 0 && (
        <section className="px-4 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center [font-family:var(--ap-titulo)] text-4xl">Para cada promessa</h2>
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4">
              {relacionados.map((p, i) => <CartaoAurea key={p.id} p={p} i={i} href={`${base}/produto/${p.id}`} moeda={loja.moeda} />)}
            </div>
          </div>
        </section>
      )}

      <BlocoConcierge telefoneWA={loja.telefoneWA} subdominio={subdominio} />
      {avaliacoes && <div className="bg-[#F5F1E8] text-slate-900">{avaliacoes}</div>}
    </div>
  );
}

// ── 03 · Casa Mussulo ─────────────────────────────────────────────────────────
function ProdutoMussulo({ subdominio, loja, produto, relacionados, avaliacoes }: Props) {
  const base = `/loja/${subdominio}`;
  return (
    <div className="bg-[#F2F2EF] text-[#1D2522]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-14">
        <Configurador
          slug="casa-mussulo"
          produto={produto}
          moeda={loja.moeda}
          subdominio={subdominio}
          telefoneWA={loja.telefoneWA}
          painel={temImagem(produto.imagemUrl) ? <img src={produto.imagemUrl} alt={produto.titulo} className="absolute inset-0 h-full w-full object-cover" /> : null}
          cabecalho={
            <div className="space-y-3">
              <nav className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1F6F78]">
                <Link href={base} className="hover:underline">{loja.nome}</Link>
                <span className="mx-2">·</span>
                <Link href={`${base}#colecao`} className="hover:underline">Peças</Link>
              </nav>
              <h1 className="[font-family:var(--ap-titulo)] text-3xl font-extrabold leading-tight lg:text-4xl">{produto.titulo}</h1>
            </div>
          }
          rodape={<Descricao texto={produto.descricao} className="space-y-2 border-t border-[#D9D9D3] pt-6 text-sm leading-relaxed text-[#66706B]" />}
        />
      </div>

      <BlocoServico telefoneWA={loja.telefoneWA} subdominio={subdominio} />

      {relacionados.length > 0 && (
        <section className="px-4 pb-16 sm:px-8 lg:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1F6F78]">Combina com</p>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {relacionados.map((p, i) => <CartaoMussulo key={p.id} p={p} i={i} href={`${base}/produto/${p.id}`} moeda={loja.moeda} />)}
          </div>
        </section>
      )}
      {avaliacoes}
    </div>
  );
}
