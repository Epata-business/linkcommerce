"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLink { href: string; label: string; icon?: string }

export function DashboardNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-0.5 px-2 pb-4 overflow-y-auto sidebar-scroll">
      {links.map((link) => {
        const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={[
              "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
              isActive
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/6 hover:text-slate-200",
            ].join(" ")}
          >
            {link.icon && (
              <span className={[
                "mr-2.5 text-sm leading-none transition-transform duration-150",
                isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100",
              ].join(" ")}>
                {link.icon}
              </span>
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
