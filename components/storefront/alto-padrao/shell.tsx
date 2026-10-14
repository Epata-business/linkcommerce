// Cabeçalho, rodapé e tipografia das lojas com tema Alto Padrão. Chamado por
// app/loja/[subdominio]/layout.tsx; envolve todas as páginas da loja (início, produto,
// checkout, conta…). Reutiliza carrinho, conta, idioma e WhatsApp tal como existem.
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { ContaNav } from "@/components/storefront/conta-nav";
import { StorefrontLanguageSwitcher } from "@/components/storefront/language-switcher";
import { WhatsAppButton } from "@/components/storefront/whatsapp-button";
import { t, type Locale } from "@/lib/i18n";
import { CONFIG_ALTO_PADRAO, type SlugAltoPadrao } from "@/lib/temas-alto-padrao";
import { FONTES } from "./fontes";

interface Props {
  slug: SlugAltoPadrao;
  subdominio: string;
  locale: Locale;
  emPreview: boolean;
  loja: {
    nome: string;
    logotipoUrl: string | null;
    moeda: string;
    telefoneWA: string | null;
    corPrimaria: string;
    corSecundaria: string;
  };
  children: ReactNode;
}

// As restantes páginas da loja (checkout, conta, contacto…) mantêm o seu desenho claro;
// por isso o fundo geral é sempre claro, mesmo na Áurea, e cada secção do tema pinta o seu.
const FUNDO_GERAL: Record<SlugAltoPadrao, string> = {
  "maison-ndala": "#F8F6F1",
  aurea: "#F5F1E8",
  "casa-mussulo": "#F2F2EF",
};

// Ajusta os controlos existentes (conta, idioma) ao cabeçalho escuro da Áurea.
const CONTROLOS_ESCUROS =
  "[&>a]:!text-[#E9DFC8] [&>a:hover]:!bg-white/5 [&>div>button]:!text-[#E9DFC8] [&>div>button]:!border-white/15 [&>div>button:hover]:!bg-white/5";

export function ShellAltoPadrao({ slug, subdominio, locale, emPreview, loja, children }: Props) {
  const cfg = CONFIG_ALTO_PADRAO[slug];
  const base = `/loja/${subdominio}`;
  const estilo = {
    "--cor-primaria": loja.corPrimaria,
    "--cor-secundaria": loja.corSecundaria,
    "--ap-titulo": FONTES[slug].titulo,
    background: FUNDO_GERAL[slug],
  } as CSSProperties;

  const controlos = (
    <div className={`flex items-center gap-1 ${slug === "aurea" ? CONTROLOS_ESCUROS : ""}`}>
      <ContaNav subdominio={subdominio} cor={cfg.cores.destaque} />
      <StorefrontLanguageSwitcher current={locale} cor={cfg.cores.destaque} />
      <CartDrawer corPrimaria={cfg.cores.botao} locale={locale} moeda={loja.moeda} />
    </div>
  );

  const logo = loja.logotipoUrl ? (
    <Image src={loja.logotipoUrl} alt={loja.nome} width={40} height={40} className="h-10 w-10 flex-shrink-0 rounded object-cover" />
  ) : null;

  return (
    <div data-moeda={loja.moeda} data-tema={slug} style={estilo} className={`${FONTES[slug].classeCorpo} flex min-h-screen flex-col`}>
      {emPreview && (
        <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-xs font-semibold text-white">
          <span>👁️</span>
          <span>Modo pré-visualização — esta loja ainda não está publicada ao público</span>
          <a href="/dashboard/configuracoes" className="underline underline-offset-2 hover:opacity-80">Publicar agora →</a>
        </div>
      )}

      {slug === "maison-ndala" && (
        <>
          {cfg.textos.anuncio && (
            <div className="bg-[#111111] px-4 py-2.5 text-center text-[10px] uppercase tracking-[0.25em] text-[#F8F6F1] sm:text-[11px]">
              {cfg.textos.anuncio}
            </div>
          )}
          <header className="sticky top-0 z-40 border-b border-[#E2DED5] bg-[#F8F6F1]/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-8 md:grid md:grid-cols-[1fr_auto_1fr]">
              <nav className="hidden items-center gap-7 text-sm text-[#141414] md:flex">
                <Link href={`${base}#colecao`} className="hover:text-[#2433A0]">Coleção</Link>
                <Link href={`${base}#prova`} className="hover:text-[#2433A0]">Prova privada</Link>
                <Link href={`${base}/contacto`} className="hover:text-[#2433A0]">{t("nav_contact", locale)}</Link>
              </nav>
              <Link href={base} className="flex min-w-0 items-center gap-3 justify-self-center">
                {logo}
                <span className="truncate [font-family:var(--ap-titulo)] text-base uppercase tracking-[0.18em] text-[#141414] sm:text-2xl sm:tracking-[0.35em]">{loja.nome}</span>
              </Link>
              <div className="justify-self-end">{controlos}</div>
            </div>
          </header>
        </>
      )}

      {slug === "aurea" && (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0C231C]/95 backdrop-blur">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8 md:grid md:grid-cols-[1fr_auto_1fr]">
            <Link href={base} className="flex min-w-0 items-center gap-3">
              {logo}
              <span className="min-w-0">
                <span className="block truncate [font-family:var(--ap-titulo)] text-xl uppercase tracking-[0.2em] text-[#D4B26A] sm:text-2xl sm:tracking-[0.3em]">{loja.nome}</span>
                {cfg.textos.subMarca && <span className="block text-[9px] uppercase tracking-[0.35em] text-[#9DB3A8]">{cfg.textos.subMarca}</span>}
              </span>
            </Link>
            <nav className="hidden items-center gap-8 text-[13px] tracking-[0.12em] text-[#E9DFC8] md:flex">
              <Link href={`${base}#colecao`} className="hover:text-[#D4B26A]">Coleções</Link>
              <Link href={`${base}#concierge`} className="hover:text-[#D4B26A]">Concierge</Link>
              <Link href={`${base}/contacto`} className="hover:text-[#D4B26A]">{t("nav_contact", locale)}</Link>
            </nav>
            <div className="justify-self-end">{controlos}</div>
          </div>
        </header>
      )}

      {slug === "casa-mussulo" && (
        <header className="sticky top-0 z-40 bg-[#F2F2EF]/95 backdrop-blur">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8 lg:grid lg:grid-cols-[1fr_auto_1fr]">
            <Link href={base} className="flex min-w-0 items-center gap-3">
              {logo}
              <LogoMussulo nome={loja.nome} />
            </Link>
            <nav className="hidden items-center gap-7 text-[15px] text-[#1D2522] lg:flex">
              <Link href={`${base}#ambiente`} className="hover:text-[#1F6F78]">Ambiente</Link>
              <Link href={`${base}#colecao`} className="hover:text-[#1F6F78]">Peças</Link>
              <Link href={`${base}#servico`} className="hover:text-[#1F6F78]">Interiores</Link>
              <Link href={`${base}/contacto`} className="hover:text-[#1F6F78]">{t("nav_contact", locale)}</Link>
            </nav>
            <div className="flex items-center gap-2 justify-self-end">
              <Link href={`${base}/contacto`} className="hidden h-10 items-center rounded-full border border-[#1D2522] px-5 text-sm font-semibold text-[#1D2522] transition hover:bg-[#1D2522] hover:text-[#F2F2EF] sm:inline-flex">
                Showroom
              </Link>
              {controlos}
            </div>
          </div>
        </header>
      )}

      <main className="flex-1">{children}</main>

      <Rodape slug={slug} base={base} nome={loja.nome} locale={locale} />
      <WhatsAppButton numero={loja.telefoneWA} />
    </div>
  );
}

// "Casa Mussulo" → CASA / MUSSULO (segunda linha a petróleo)
function LogoMussulo({ nome }: { nome: string }) {
  const palavras = nome.trim().split(/\s+/);
  const primeira = palavras.length > 1 ? palavras[0] : "";
  const resto = palavras.length > 1 ? palavras.slice(1).join(" ") : palavras[0];
  return (
    <span className="block min-w-0 [font-family:var(--ap-titulo)] text-[15px] font-extrabold uppercase leading-[0.95] tracking-wide sm:text-lg">
      {primeira && <span className="block truncate text-[#1D2522]">{primeira}</span>}
      <span className="block truncate text-[#1F6F78]">{resto}</span>
    </span>
  );
}

function Rodape({ slug, base, nome, locale }: { slug: SlugAltoPadrao; base: string; nome: string; locale: Locale }) {
  const ano = new Date().getFullYear();
  const links = [
    { href: `${base}/conta`, label: "Conta" },
    { href: `${base}/contacto`, label: t("nav_contact", locale) },
    { href: `${base}/devolucoes`, label: `${t("nav_returns", locale)} & ${t("returns_exchange_title", locale)}` },
  ];

  if (slug === "aurea") {
    return (
      <footer className="border-t border-white/10 bg-[#0B1F19] text-[#E9DFC8]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-14 text-center">
          <p className="[font-family:var(--ap-titulo)] text-2xl uppercase tracking-[0.3em] text-[#D4B26A]">{nome}</p>
          <nav className="flex flex-wrap justify-center gap-x-7 gap-y-2 text-xs uppercase tracking-[0.2em] text-[#9DB3A8]">
            {links.map((l) => <Link key={l.href} href={l.href} className="hover:text-[#D4B26A]">{l.label}</Link>)}
          </nav>
          <p className="text-[11px] text-[#9DB3A8]/70">© {ano} {nome} · {t("footer_powered", locale)}</p>
        </div>
      </footer>
    );
  }

  const ndala = slug === "maison-ndala";
  return (
    <footer className={ndala ? "border-t border-[#E2DED5] bg-[#F8F6F1] text-[#141414]" : "bg-[#F2F2EF] text-[#1D2522]"}>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          {ndala ? (
            <p className="[font-family:var(--ap-titulo)] text-2xl uppercase tracking-[0.35em]">{nome}</p>
          ) : (
            <LogoMussulo nome={nome} />
          )}
          <p className={`mt-4 max-w-xs text-sm ${ndala ? "font-light text-[#6B6760]" : "text-[#66706B]"}`}>{CONFIG_ALTO_PADRAO[slug].publico}</p>
        </div>
        <div>
          <p className={ndala ? "text-[11px] uppercase tracking-[0.2em] text-[#6B6760]" : "text-xs font-semibold uppercase tracking-[0.18em] text-[#1F6F78]"}>{t("nav_store", locale)}</p>
          <nav className="mt-4 flex flex-col gap-2 text-sm">
            <Link href={`${base}#colecao`} className="hover:underline">{ndala ? "Coleção" : "Peças"}</Link>
            <Link href={`${base}${ndala ? "#prova" : "#servico"}`} className="hover:underline">{ndala ? "Prova privada" : "Projeto de interiores"}</Link>
          </nav>
        </div>
        <div>
          <p className={ndala ? "text-[11px] uppercase tracking-[0.2em] text-[#6B6760]" : "text-xs font-semibold uppercase tracking-[0.18em] text-[#1F6F78]"}>Cliente</p>
          <nav className="mt-4 flex flex-col gap-2 text-sm">
            {links.map((l) => <Link key={l.href} href={l.href} className="hover:underline">{l.label}</Link>)}
          </nav>
        </div>
      </div>
      <div className={`border-t ${ndala ? "border-[#E2DED5] text-[#6B6760]" : "border-[#D9D9D3] text-[#66706B]"}`}>
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs sm:px-8">© {ano} {nome} · {t("footer_powered", locale)}</p>
      </div>
    </footer>
  );
}
