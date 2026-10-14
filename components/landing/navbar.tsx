"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/landing/language-switcher";

interface NavbarProps {
  locale: string;
  featLabel: string;
  pricLabel: string;
  aboutLabel: string;
  loginLabel: string;
  startLabel: string;
}

export function Navbar({ locale, featLabel, pricLabel, aboutLabel, loginLabel, startLabel }: NavbarProps) {
  const [open, setOpen] = useState(false);

  // Fecha o menu ao redimensionar para desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Bloqueia scroll do body quando o menu está aberto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const links = [
    { href: "#funcionalidades", label: featLabel },
    { href: "#angola", label: "Angola" },
    { href: "#precos", label: pricLabel },
    { href: "#quem-somos", label: aboutLabel },
  ];

  return (
    <>
      <nav
        className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 py-3 sm:py-4"
        style={{ background: "rgba(8,10,18,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/" className="text-lg sm:text-xl font-bold tracking-tight text-white shrink-0">
            Link<span style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Commerce</span>
          </Link>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-1 text-sm">
            {links.map(l => (
              <a key={l.href} href={l.href}
                className="px-3 py-2 text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                {l.label}
              </a>
            ))}
          </div>

          {/* Direita: language + entrar + começar + hamburger */}
          <div className="flex items-center gap-1 sm:gap-3">
            <LanguageSwitcher current={locale} />

            <Link href="/entrar"
              className="hidden sm:inline-flex text-sm font-medium text-white/55 hover:text-white transition-colors px-3 py-2">
              {loginLabel}
            </Link>

            <Link href="/comecar"
              className="hidden sm:inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105 hover:opacity-90 shrink-0"
              style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)", boxShadow: "0 0 20px rgba(21,61,236,0.4)" }}>
              {startLabel}
            </Link>

            {/* Hamburger — só em mobile */}
            <button
              onClick={() => setOpen(v => !v)}
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-white/10 transition-colors gap-[5px] shrink-0"
            >
              <span className={`block h-[2px] w-5 bg-white rounded transition-all duration-200 ${open ? "rotate-45 translate-y-[7px]" : ""}`} />
              <span className={`block h-[2px] w-5 bg-white rounded transition-all duration-200 ${open ? "opacity-0" : ""}`} />
              <span className={`block h-[2px] w-5 bg-white rounded transition-all duration-200 ${open ? "-rotate-45 -translate-y-[7px]" : ""}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Menu mobile deslizante */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
        style={{ background: "rgba(0,0,0,0.5)" }}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 md:hidden w-72 flex flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: "rgba(8,10,18,0.98)", backdropFilter: "blur(24px)", borderLeft: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Header do drawer */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
          <span className="text-base font-bold text-white">
            Link<span style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Commerce</span>
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Links de navegação */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(l => (
            <a key={l.href} href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Botões de acção no rodapé do drawer */}
        <div className="px-4 pb-8 pt-4 border-t border-white/5 space-y-3">
          <Link href="/entrar"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-full rounded-xl border border-white/15 py-3 text-sm font-semibold text-white/70 hover:text-white hover:border-white/30 transition-colors">
            {loginLabel}
          </Link>
          <Link href="/comecar"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)", boxShadow: "0 0 20px rgba(21,61,236,0.35)" }}>
            {startLabel}
          </Link>
        </div>
      </div>
    </>
  );
}
