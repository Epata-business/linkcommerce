import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getLocale, t } from "@/lib/i18n";
import Link from "next/link";
import { ContactoForm } from "./contacto-form";

interface PageProps { params: { subdominio: string } }

export async function generateMetadata({ params }: PageProps) {
  const locale = getLocale();
  const loja = await prisma.loja.findUnique({ where: { subdominio: params.subdominio } });
  return { title: `${t("contact_title", locale)} — ${loja?.nome ?? "Loja"}` };
}

export default async function ContactoPage({ params }: PageProps) {
  const loja = await prisma.loja.findUnique({ where: { subdominio: params.subdominio } });
  if (!loja) notFound();

  const locale = getLocale();
  const cor = loja.corPrimaria || "#153DFC";

  const labels = {
    nome: t("contact_form_name", locale),
    email: t("contact_form_email", locale),
    assunto: t("contact_form_subject", locale),
    msg: t("contact_form_msg", locale),
    btn: t("contact_form_btn", locale),
    ph_nome: t("contact_form_placeholder_name", locale),
    ph_assunto: t("contact_form_placeholder_subject", locale),
    ph_msg: t("contact_form_placeholder_msg", locale),
  };

  return (
    <section className="mx-auto max-w-2xl px-4 py-14">
      <Link href={`/loja/${params.subdominio}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6">
        ← {t("store_all_products", locale)}
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("contact_title", locale)}</h1>
      <p className="text-slate-500 mb-10">{t("contact_sub", locale)}</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {[
          { icon: "📧", titulo: t("contact_email_label", locale), desc: `suporte@${params.subdominio}.linkcommerce.app` },
          { icon: "⏱️", titulo: t("contact_response", locale), desc: t("contact_response_val", locale) },
        ].map((item) => (
          <div key={item.titulo} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="text-2xl mb-2">{item.icon}</div>
            <p className="font-semibold text-slate-800">{item.titulo}</p>
            <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      <ContactoForm subdominio={params.subdominio} cor={cor} labels={labels} />
    </section>
  );
}
