"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PERIODOS, PeriodoKey } from "@/lib/periodo";

export function PeriodoSelector({ periodoAtual }: { periodoAtual: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const novo = new URLSearchParams(params.toString());
    novo.set("periodo", e.target.value);
    router.push(`${pathname}?${novo.toString()}`);
  }

  return (
    <select
      value={periodoAtual}
      onChange={onChange}
      className="text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
    >
      {PERIODOS.map((p) => (
        <option key={p.key} value={p.key}>
          {p.label}
        </option>
      ))}
    </select>
  );
}
