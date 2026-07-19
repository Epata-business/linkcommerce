import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WhatsAppButton } from "@/components/storefront/whatsapp-button";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { StorefrontLanguageSwitcher } from "@/components/storefront/language-switcher";
import { getLocale, t } from "@/lib/i18n";

interface Props {
  children: React.ReactNode;
  params: { subdominio: string };
}

export default async function StorefrontLayout({ children, params }: Props) {
  const loja = await prisma.loja.findUnique({
    where: { subdominio: params.subdominio },
  });
  if (!loja) notFound();

  const locale = getLocale();
  const cor = loja.corPrimaria || "#153DFC";
  const emPreview = !loja.publicada;

  return (
    <div
      style={{
        ["--cor-primaria" as string]: cor,
        ["--cor-secundaria" as string]: loja.corSecundaria,
      }}
      className="min-h-screen bg-slate-50 flex flex-col"
    >
      {/* Banner pré-visualização — visível apenas para lojas não publicadas */}
      {emPreview && (
        <div className="bg-amber-500 text-white text-xs font-semibold text-center py-2 px-4 flex items-center justify-center gap-2">
          <span>👁️</span>
          <span>Modo pré-visualização — esta loja ainda não está publicada ao público</span>
          <a href="/dashboard/configuracoes" className="underline underline-offset-2 hover:opacity-80">Publicar agora →</a>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md"
        style={{ borderBottom: `1px solid ${cor}20` }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 gap-4">
          <Link href={`/loja/${params.subdominio}`} className="flex items-center gap-3 min-w-0">
            {loja.logotipoUrl ? (
              <Image src={loja.logotipoUrl} alt={loja.nome} width={36} height={36} className="rounded-lg flex-shrink-0" />
            ) : (
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl font-black text-white text-sm shadow-sm"
                style={{ background: `linear-gradient(135deg, ${cor}, ${cor}bb)` }}>
                {loja.nome.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-lg font-bold text-slate-900 truncate">{loja.nome}</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-500">
            <Link href={`/loja/${params.subdominio}`}
              className="hover:text-slate-900 transition-colors hover:underline underline-offset-4"
              style={{ textDecorationColor: cor }}>
              {t("nav_store", locale)}
            </Link>
            <Link href={`/loja/${params.subdominio}/contacto`} className="hover:text-slate-900 transition-colors">
              {t("nav_contact", locale)}
            </Link>
            <Link href={`/loja/${params.subdominio}/devolucoes`} className="hover:text-slate-900 transition-colors">
              {t("nav_returns", locale)}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <StorefrontLanguageSwitcher current={locale} cor={cor} />
            <CartDrawer corPrimaria={cor} locale={locale} />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="mt-16" style={{ borderTop: `1px solid ${cor}15`, background: `${cor}04` }}>
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg font-black text-white text-xs"
                style={{ background: `linear-gradient(135deg, ${cor}, ${cor}bb)` }}>
                {loja.nome.charAt(0).toUpperCase()}
              </div>
              <span className="font-bold text-slate-800">{loja.nome}</span>
            </div>

            <nav className="flex items-center gap-5 text-sm text-slate-400">
              <Link href={`/loja/${params.subdominio}/contacto`} className="hover:text-slate-700 transition-colors">
                {t("nav_contact", locale)}
              </Link>
              <Link href={`/loja/${params.subdominio}/devolucoes`} className="hover:text-slate-700 transition-colors">
                {t("nav_returns", locale)} & {t("returns_exchange_title", locale)}
              </Link>
            </nav>

            <div className="flex flex-col items-center sm:items-end gap-1">
              <p className="text-xs text-slate-400">© {new Date().getFullYear()} {loja.nome}</p>
              <p className="text-[10px] text-slate-300">{t("footer_powered", locale)}</p>
            </div>
          </div>
        </div>
      </footer>

      <WhatsAppButton numero={null} />
    </div>
  );
}
