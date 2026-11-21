"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, Archive, ShoppingBag, Users, Megaphone,
  Share2, Star, RotateCcw, ShoppingCart, Truck, QrCode,
  BarChart2, Download, UsersRound, FileText, ScrollText,
  Bell, Plug, Palette, Settings, type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  dashboard:      LayoutDashboard,
  produtos:       Package,
  inventario:     Archive,
  pedidos:        ShoppingBag,
  clientes:       Users,
  marketing:      Megaphone,
  "redes-sociais": Share2,
  fidelidade:     Star,
  devolucoes:     RotateCcw,
  carrinhos:      ShoppingCart,
  envios:         Truck,
  qrcode:         QrCode,
  relatorios:     BarChart2,
  exportar:       Download,
  equipa:         UsersRound,
  auditlog:       ScrollText,
  faturas:        FileText,
  avaliacoes:     Star,
  notificacoes:   Bell,
  api:            Plug,
  temas:          Palette,
  configuracoes:  Settings,
};

const GRUPO_MAP: Record<string, string> = {
  dashboard:       "Visão geral",
  relatorios:      "Visão geral",
  pedidos:         "Gestão",
  produtos:        "Gestão",
  inventario:      "Gestão",
  clientes:        "Gestão",
  avaliacoes:      "Gestão",
  devolucoes:      "Gestão",
  carrinhos:       "Gestão",
  marketing:       "Loja",
  "redes-sociais": "Loja",
  fidelidade:      "Loja",
  envios:          "Loja",
  qrcode:          "Loja",
  temas:           "Loja",
  equipa:          "Administração",
  auditlog:        "Administração",
  faturas:         "Administração",
  notificacoes:    "Administração",
  exportar:        "Administração",
  api:             "Administração",
  configuracoes:   "Administração",
};

const ORDEM_GRUPOS = ["Visão geral", "Gestão", "Loja", "Administração"];

interface NavLink { href: string; label: string; icon?: string }

export function DashboardNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  // Agrupar links preservando a ordem original dentro de cada grupo
  const grupos: Record<string, NavLink[]> = {};
  for (const link of links) {
    const grupo = (link.icon && GRUPO_MAP[link.icon]) ?? "Administração";
    if (!grupos[grupo]) grupos[grupo] = [];
    grupos[grupo].push(link);
  }

  return (
    <nav className="flex-1 px-2 pb-4 overflow-y-auto sidebar-scroll">
      {ORDEM_GRUPOS.filter(g => grupos[g]?.length).map((grupo) => (
        <div key={grupo} className="mb-1">
          <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/20 select-none">
            {grupo}
          </p>
          <div className="space-y-0.5">
            {grupos[grupo].map((link) => {
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              const IconComp = link.icon ? ICON_MAP[link.icon] : null;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/6 hover:text-slate-200",
                  ].join(" ")}
                >
                  {IconComp && (
                    <IconComp
                      className={[
                        "w-4 h-4 flex-shrink-0 transition-opacity duration-150",
                        isActive ? "opacity-100" : "opacity-50 group-hover:opacity-80",
                      ].join(" ")}
                      strokeWidth={1.75}
                    />
                  )}
                  <span className="truncate">{link.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#8381FB] flex-shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
