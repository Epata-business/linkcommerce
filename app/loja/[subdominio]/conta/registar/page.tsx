"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

export default function RegistarPage() {
  const { subdominio } = useParams<{ subdominio: string }>();
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/loja/${subdominio}/conta/registar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.erro ?? "Erro ao registar"); return; }
      router.push(`/loja/${subdominio}/conta`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-black text-slate-900 mb-1">Criar conta</h1>
        <p className="text-sm text-slate-400 mb-8">Acompanha os teus pedidos e acumula pontos de fidelidade.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nome</label>
            <input
              type="text" required value={nome} onChange={(e) => setNome(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="O teu nome"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="o.teu@email.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Password</label>
            <input
              type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {erro && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{erro}</div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, var(--cor-primaria), var(--cor-primaria)bb)" }}
          >
            {loading ? "A criar conta…" : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Já tens conta?{" "}
          <Link href={`/loja/${subdominio}/conta/entrar`} className="font-semibold text-slate-700 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
