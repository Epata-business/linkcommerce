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

interface NavLink { href: string; label: string; icon?: string }

export function DashboardNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-0.5 px-2 pb-4 overflow-y-auto sidebar-scroll">
      {links.map((link) => {
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
                  isActive ? "opacity-100" : "opacity-60 group-hover:opacity-90",
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
    </nav>
  );
}
