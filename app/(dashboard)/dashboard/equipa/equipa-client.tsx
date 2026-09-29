"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROLES_ATRIBUIVEIS, ROLE_LABELS, type RoleUtilizador } from "@/lib/rbac";

type Membro = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  roleLabel: string;
  createdAt: Date;
};

export function EquipaClient({ membros }: { membros: Membro[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Estado do formulário de convite
  const [email, setEmail] = useState("");
  const [novoRole, setNovoRole] = useState<RoleUtilizador>(ROLES_ATRIBUIVEIS[0] as RoleUtilizador);
  const [enviando, setEnviando] = useState(false);
  const [erroConvite, setErroConvite] = useState<string | null>(null);

  async function handleChangeRole(id: string, role: string) {
    setLoading(id);
    setErro(null);
    const res = await fetch(`/api/equipa/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ novoRole: role }),
    });
    const data = await res.json();
    if (!res.ok) setErro(data.erro ?? "Erro ao alterar role");
    else router.refresh();
    setLoading(null);
  }

  async function handleRemover(id: string) {
    if (!confirm("Remover este membro da equipa?")) return;
    setLoading(id);
    setErro(null);
    const res = await fetch(`/api/equipa/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) setErro(data.erro ?? "Erro ao remover membro");
    else router.refresh();
    setLoading(null);
  }

  async function handleConvidar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErroConvite(null);
    const res = await fetch("/api/equipa/convidar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, novoRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErroConvite(data.erro ?? "Erro ao convidar membro");
    } else {
      setEmail("");
      if (data.conviteEnviado) {
        setErroConvite(null);
        alert(`Convite enviado para ${email}. O utilizador receberá um email com instruções.`);
      }
      router.refresh();
    }
    setEnviando(false);
  }

  return (
    <div className="space-y-8">
      {/* Formulário de convite */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 mb-4">Adicionar membro</h2>
        <form onSubmit={handleConvidar} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            placeholder="email@exemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={novoRole}
            onChange={e => setNovoRole(e.target.value as RoleUtilizador)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {ROLES_ATRIBUIVEIS.map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r as RoleUtilizador]}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {enviando ? "A adicionar…" : "Adicionar"}
          </button>
        </form>
        {erroConvite && (
          <p className="mt-2 text-xs text-red-600">{erroConvite}</p>
        )}
        <p className="mt-2 text-xs text-slate-400">
          Se o utilizador já tem conta, é adicionado imediatamente. Se não tem conta, receberá um email de convite.
        </p>
      </div>

      {/* Lista de membros */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50">
          <h2 className="text-sm font-bold text-slate-700">Membros actuais</h2>
        </div>
        {erro && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-100 text-xs text-red-600">{erro}</div>
        )}
        <ul className="divide-y divide-slate-50">
          {membros.map(m => (
            <li key={m.id} className="flex items-center justify-between px-6 py-4 gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{m.name ?? m.email}</p>
                {m.name && <p className="text-xs text-slate-400 truncate">{m.email}</p>}
              </div>
              {m.role === "LOJISTA" ? (
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 rounded-full px-3 py-1">
                  {m.roleLabel}
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={m.role}
                    disabled={loading === m.id}
                    onChange={e => handleChangeRole(m.id, e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {ROLES_ATRIBUIVEIS.map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r as RoleUtilizador]}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRemover(m.id)}
                    disabled={loading === m.id}
                    className="text-xs text-slate-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                  >
                    {loading === m.id ? "…" : "Remover"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
