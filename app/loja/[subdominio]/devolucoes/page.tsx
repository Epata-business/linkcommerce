import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getLocale, t } from "@/lib/i18n";
import Link from "next/link";

interface PageProps { params: { subdominio: string } }

export async function generateMetadata({ params }: PageProps) {
  const locale = getLocale();
  const loja = await prisma.loja.findUnique({ where: { subdominio: params.subdominio } });
  return { title: `${t("returns_title", locale)} — ${loja?.nome ?? "Loja"}` };
}

export default async function DevolucoesPage({ params }: PageProps) {
  const loja = await prisma.loja.findUnique({ where: { subdominio: params.subdominio } });
  if (!loja) notFound();

  const locale = getLocale();

  const sections = [
    { titulo: t("returns_policy_title", locale), conteudo: t("returns_policy_body", locale) },
    { titulo: t("returns_how_title", locale), conteudo: t("returns_how_body", locale) },
    { titulo: t("returns_refund_title", locale), conteudo: t("returns_refund_body", locale) },
    { titulo: t("returns_exchange_title", locale), conteudo: t("returns_exchange_body", locale) },
    { titulo: t("returns_excluded_title", locale), conteudo: t("returns_excluded_body", locale) },
  ];

  return (
    <section className="mx-auto max-w-2xl px-4 py-14">
      <Link href={`/loja/${params.subdominio}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6 block">
        ← {t("store_all_products", locale)}
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("returns_title", locale)}</h1>
      <p className="text-slate-500 mb-10">{t("returns_sub", locale)}</p>

      <div className="flex gap-3 mb-10">
        {[
          { icon: "🔄", label: t("returns_14_days", locale) },
          { icon: "💳", label: t("returns_refund_days", locale) },
          { icon: "📦", label: t("returns_simple", locale) },
        ].map((item) => (
          <div key={item.label} className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 text-center">
            <div className="text-2xl mb-1">{item.icon}</div>
            <p className="text-xs font-medium text-slate-700">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {sections.map((s) => (
          <div key={s.titulo} className="rounded-2xl border border-slate-100 bg-white p-6">
            <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ backgroundColor: loja.corPrimaria }} />
              {s.titulo}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">{s.conteudo}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl p-5 text-white text-center" style={{ backgroundColor: loja.corPrimaria }}>
        <p className="font-semibold mb-1">{t("returns_need_help", locale)}</p>
        <p className="text-sm opacity-80 mb-3">{t("returns_help_sub", locale)}</p>
        <a href={`/loja/${params.subdominio}/contacto`}
          className="inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ color: loja.corPrimaria }}>
          {t("returns_contact_btn", locale)}
        </a>
      </div>
    </section>
  );
}
