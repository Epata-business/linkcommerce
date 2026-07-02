"use client";
import { useRouter } from "next/navigation";

export function BackButton({ href, label = "← Voltar" }: { href?: string; label?: string }) {
  const router = useRouter();
  if (href) {
    return (
      <a href={href} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4 block">
        {label}
      </a>
    );
  }
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
    >
      {label}
    </button>
  );
}
