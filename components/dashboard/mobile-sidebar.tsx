"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface NavLink { href: string; label: string }

interface Props {
  navLinks: NavLink[];
  email: string;
  subdominio: string | null;
  nomeLoja: string | null;
  currentLang: string;
  currentMoeda: string;
}

export function MobileSidebar({ navLinks, email, subdominio, nomeLoja }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Botão hambúrguer */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-slate-800 transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect y="4" width="22" height="2" rx="1" fill="currentColor"/>
          <rect y="10" width="22" height="2" rx="1" fill="currentColor"/>
          <rect y="16" width="22" height="2" rx="1" fill="currentColor"/>
        </svg>
      </button>

      {/* Overlay + drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay escuro */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div className="relative flex w-[80vw] max-w-xs flex-col bg-slate-900 text-white h-full overflow-y-auto">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <span className="text-base font-bold tracking-tight">LinkCommerce</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-800 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Navegação */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${
                      isActive
                        ? "bg-slate-700 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Ver loja */}
            {subdominio && (
              <div className="px-3 pb-3">
                <a
                  href={`https://${subdominio}.linkcommerce.cc`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors min-h-[44px]"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 1c0 0-3 2.5-3 7s3 7 3 7M8 1c0 0 3 2.5 3 7s-3 7-3 7M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Ver loja {nomeLoja ? `· ${nomeLoja}` : ""}
                </a>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-slate-800 px-5 py-4">
              <p className="truncate text-xs text-slate-400 mb-3">{email}</p>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full rounded-xl border border-slate-700 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors min-h-[44px]"
              >
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
