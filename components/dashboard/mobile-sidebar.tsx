"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface NavLink { href: string; label: string; icon?: string }

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
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect y="3" width="20" height="1.5" rx="0.75" fill="currentColor"/>
          <rect y="9.25" width="20" height="1.5" rx="0.75" fill="currentColor"/>
          <rect y="15.5" width="14" height="1.5" rx="0.75" fill="currentColor"/>
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="relative flex w-[82vw] max-w-[300px] flex-col h-full overflow-y-auto sidebar-scroll"
            style={{ background: "linear-gradient(180deg, #0D1117 0%, #080A12 100%)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-sm font-bold tracking-tight text-white">
                Link<span style={{ color: "#8381FB" }}>Commerce</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-3 space-y-0.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all min-h-[44px]",
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:bg-white/6 hover:text-slate-200",
                    ].join(" ")}
                  >
                    {link.icon && (
                      <span className={["mr-2.5 text-sm leading-none", isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"].join(" ")}>
                        {link.icon}
                      </span>
                    )}
                    <span className="flex-1 truncate">{link.label}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#8381FB] flex-shrink-0" />}
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
                  className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white min-h-[44px] transition-all"
                  style={{ background: "linear-gradient(135deg, #153DEC, #8381FB)" }}
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.25"/>
                    <path d="M7.5 1c0 0-2.5 2-2.5 6.5S7.5 14 7.5 14M7.5 1c0 0 2.5 2 2.5 6.5S7.5 14 7.5 14M1 7.5h13" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                  </svg>
                  Ver loja{nomeLoja ? ` · ${nomeLoja}` : ""}
                </a>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="truncate text-xs text-slate-500 mb-3">{email}</p>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full rounded-xl py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-all min-h-[44px]"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Terminar sessão
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
