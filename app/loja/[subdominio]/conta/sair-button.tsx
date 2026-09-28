"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SairButton({ subdominio }: { subdominio: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSair() {
    setLoading(true);
    await fetch(`/api/loja/${subdominio}/conta/sair`, { method: "POST" });
    router.push(`/loja/${subdominio}`);
    router.refresh();
  }

  return (
    <button
      onClick={handleSair}
      disabled={loading}
      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors disabled:opacity-50"
    >
      {loading ? "…" : "Sair"}
    </button>
  );
}
