"use client";
import { useRouter } from "next/navigation";

export function BackButton({ href, label = "← Voltar" }: { href?: string; label?: string }) {
  const router = useRouter();
  const cls = "inline-flex items-center gap-1.5 text-xs font-semibold text-[#9CA3AF] hover:text-[#0F1117] transition-colors mb-5";
  if (href) {
    return <a href={href} className={cls}>{label}</a>;
  }
  return (
    <button onClick={() => router.back()} className={cls}>
      {label}
    </button>
  );
}
