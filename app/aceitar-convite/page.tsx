"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function AceitarConviteForm() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const lojaId = params.get("loja") ?? "";
  const role = params.get("role") ?? "";

  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [estado, setEstado] = useState<"idle" | "loading" | "ok" | "erro">("idle");
  const [mensagemErro, setMensagemErro] = useState("");

  async function aceitar(e: React.FormEvent) {
    e.preventDefault();
    if (senha !== confirmar) { setMensagemErro("As senhas não coincidem."); return; }
    if (senha.length < 8) { setMensagemErro("A senha deve ter pelo menos 8 caracteres."); return; }
    setEstado("loading");
    setMensagemErro("");

    const res = await fetch("/api/equipa/aceitar-convite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, lojaId, role, nome, senha }),
    });
    const data = await res.json();
    if (data.ok) {
      setEstado("ok");
      setTimeout(() => router.push("/entrar"), 2500);
    } else {
      setEstado("erro");
      setMensagemErro(data.erro ?? "Convite inválido ou expirado.");
    }
  }

  if (!token || !email || !lojaId) {
    return (
      <div className="text-center py-4">
        <p className="text-red-400 text-sm">Link de convite inválido.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-semibold" style={{ color: "#8381FB" }}>
          Ir para o início →
        </Link>
      </div>
    );
  }

  return (
    <>
      {estado === "ok" ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <svg className="w-6 h-6" fill="none" stroke="#10b981" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Conta criada!</h2>
          <p className="text-sm text-white/50">A redirigir para o login…</p>
        </div>
      ) : (
        <>
          <div className="mb-7">
            <h1 className="text-2xl font-extrabold text-white">Aceitar convite</h1>
            <p className="mt-1.5 text-sm text-white/50">
              Crie a sua conta para aceder à equipa. O seu email será{" "}
              <strong className="text-white/70">{email}</strong>.
            </p>
          </div>

          {mensagemErro && (
            <div className="mb-5 rounded-xl px-4 py-3 text-sm text-red-300" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
              {mensagemErro}
            </div>
          )}

          <form onSubmit={aceitar} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="O seu nome"
                required
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#153DFC]/50 transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#153DFC]/50 transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide">Confirmar senha</label>
              <input
                type="password"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                placeholder="Repita a senha"
                required
                minLength={8}
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#153DFC]/50 transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            <button
              type="submit"
              disabled={estado === "loading"}
              className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 mt-2"
              style={{ background: "linear-gradient(135deg,#153DFC,#8381FB)", boxShadow: "0 4px 24px rgba(21,61,236,0.4)" }}
            >
              {estado === "loading" ? "A criar conta…" : "Criar conta e aceitar convite →"}
            </button>
          </form>
        </>
      )}
    </>
  );
}

export default function AceitarConvitePage() {
  return (
    <div className="min-h-screen bg-[#080A12] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-extrabold text-white">
            Link<span style={{ color: "#8381FB" }}>Commerce</span>
          </Link>
        </div>
        <div
          className="rounded-3xl p-8"
          style={{ background: "rgba(8,10,18,0.75)", border: "1px solid rgba(131,129,251,0.18)", backdropFilter: "blur(24px)", boxShadow: "0 24px 60px rgba(2,5,61,0.5)" }}
        >
          <Suspense fallback={<p className="text-white/40 text-sm">A carregar…</p>}>
            <AceitarConviteForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
