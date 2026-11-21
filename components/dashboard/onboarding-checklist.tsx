"use client";

import Link from "next/link";
import { Paintbrush, Package, Link2, QrCode } from "lucide-react";

const PASSOS = [
  {
    id: "personalizar",
    Icon: Paintbrush,
    titulo: "Personalize a sua loja",
    descricao: "Logótipo, cor e descrição",
    href: "/dashboard/configuracoes",
    cta: "Ir para configurações",
  },
  {
    id: "produto",
    Icon: Package,
    titulo: "Adicione o primeiro produto",
    descricao: "Fotos, preço e descrição",
    href: "/dashboard/produtos",
    cta: "Adicionar produto",
  },
  {
    id: "partilhar",
    Icon: Link2,
    titulo: "Partilhe o link da loja",
    descricao: "Envie aos clientes para começar a vender",
    href: "/dashboard/configuracoes",
    cta: "Ver link da loja",
  },
  {
    id: "qrcode",
    Icon: QrCode,
    titulo: "Descarregue o QR Code",
    descricao: "Imprima e coloque no seu negócio",
    href: "/dashboard/qrcode",
    cta: "Ver QR Code",
  },
];

export function OnboardingChecklist({ nomePlano }: { nomePlano: string | null }) {
  return (
    <div className="rounded-xl border border-[hsl(220_20%_91%)] bg-white overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(15,17,23,0.04)" }}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[hsl(220_20%_95%)]">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-[#0F1117] text-sm">Configure a sua loja</h2>
          {nomePlano && (
            <span className="text-[10px] font-semibold text-[#153DEC] bg-blue-50 px-2 py-0.5 rounded-full">
              {nomePlano}
            </span>
          )}
        </div>
        <span className="text-xs text-[#9CA3AF]">Passos para começar a vender</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[hsl(220_20%_95%)]">
        {PASSOS.map((passo, i) => (
          <Link
            key={passo.id}
            href={passo.href}
            className="group flex items-start gap-3 px-4 py-3.5 hover:bg-[#F7F8FC] transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F7F8FC] group-hover:bg-blue-50 transition-colors flex-shrink-0 mt-0.5">
              <passo.Icon className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#153DEC] transition-colors" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">{i + 1}</span>
              </div>
              <p className="text-sm font-medium text-[#0F1117] leading-snug">{passo.titulo}</p>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5 leading-snug">{passo.descricao}</p>
              <p className="text-[11px] font-semibold text-[#153DEC] mt-1.5 group-hover:text-[#1234D0] transition-colors">{passo.cta} →</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
