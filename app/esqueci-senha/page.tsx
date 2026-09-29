"use client";

import { useState } from "react";
import Link from "next/link";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "loading" | "enviado" | "erro">("idle");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("loading");
    try {
      await fetch("/api/auth/esqueci-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setEstado("enviado");
    } catch {
      setEstado("erro");
    }
  }

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
          style={{
            background: "rgba(8,10,18,0.75)",
            border: "1px solid rgba(131,129,251,0.18)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 24px 60px rgba(2,5,61,0.5)",
          }}
        >
          <Link
            href="/entrar"
            className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors mb-6"
          >
            ← Voltar ao login
          </Link>

          {estado === "enviado" ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(21,61,236,0.15)", border: "1px solid rgba(21,61,236,0.3)" }}>
                <svg className="w-6 h-6" fill="none" stroke="#8381FB" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Verifique o seu email</h2>
              <p className="text-sm text-white/50">
                Se existir uma conta com o email <strong className="text-white/70">{email}</strong>, receberá um link para redefinir a sua senha nos próximos minutos.
              </p>
              <p className="text-xs text-white/30 mt-4">O link expira em 1 hora.</p>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-extrabold text-white">Esqueceu a senha?</h1>
                <p className="mt-1.5 text-sm text-white/50">
                  Introduza o seu email e enviaremos um link para redefinir a senha.
                </p>
              </div>

              {estado === "erro" && (
                <div
                  className="mb-5 rounded-xl px-4 py-3 text-sm text-red-300"
                  style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
                >
                  Ocorreu um erro. Por favor tente novamente.
                </div>
              )}

              <form onSubmit={enviar} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    required
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
                  {estado === "loading" ? "A enviar…" : "Enviar link de recuperação →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
