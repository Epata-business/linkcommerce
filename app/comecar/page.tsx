"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "conta" | "template" | "loja" | "loading";

const TEMPLATES = [
  { id: "moda",    label: "Moda & Estilo",        emoji: "👗", desc: "Elegante, minimalista", cor: "#c9a96e", bg: "#1a1a1a" },
  { id: "fitness", label: "Suplementos & Fitness", emoji: "💪", desc: "Energético, bold",      cor: "#f97316", bg: "#0a0a0a" },
  { id: "eco",     label: "Ecológico & Natural",   emoji: "🌿", desc: "Tons terra, calmo",     cor: "#a8c5a0", bg: "#2d4a3e" },
  { id: "tech",    label: "Tecnologia",            emoji: "💻", desc: "Moderno, técnico",      cor: "#3b82f6", bg: "#0f172a" },
  { id: "geral",   label: "Geral",                 emoji: "🛍️", desc: "Versátil, neutro",      cor: "#6366f1", bg: "#1e293b" },
];

const CORES: Record<string, { corPrimaria: string; corSecundaria: string }> = {
  moda:    { corPrimaria: "#1a1a1a", corSecundaria: "#c9a96e" },
  fitness: { corPrimaria: "#0a0a0a", corSecundaria: "#f97316" },
  eco:     { corPrimaria: "#2d4a3e", corSecundaria: "#a8c5a0" },
  tech:    { corPrimaria: "#0f172a", corSecundaria: "#3b82f6" },
  geral:   { corPrimaria: "#1e293b", corSecundaria: "#6366f1" },
};

const STEP_ORDER: Step[] = ["conta", "template", "loja", "loading"];

export default function ComecarPage() {
  const { update } = useSession();
  const router = useRouter();

  const [step, setStep] = useState<Step>("conta");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [templateSel, setTemplateSel] = useState("geral");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const stepIdx = STEP_ORDER.indexOf(step);

  async function handleCriarConta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const nome = form.get("nome") as string;
    const emailVal = form.get("email") as string;
    const passwordVal = form.get("password") as string;

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email: emailVal, password: passwordVal }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErro(data.erro === "email-em-uso" ? "Este email já está registado." : "A senha precisa de ter pelo menos 6 caracteres.");
      return;
    }

    setEmail(emailVal);
    setPassword(passwordVal);
    setStep("template");
  }

  async function handleCriarLoja(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const nome = form.get("nome") as string;
    const subdominio = form.get("subdominio") as string;
    const cores = CORES[templateSel];

    const res = await fetch("/api/loja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nome, subdominio, tipoNegocio: templateSel, ...cores }),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setErro(data.erro === "subdominio-em-uso" ? "Subdomínio já em uso. Escolha outro." : "Erro ao criar a loja. Tente novamente.");
      return;
    }

    setStep("loading");
    await signIn("credentials", { email, password, redirect: false });
    // Dispara update() — o JWT callback vai buscar o lojaId à DB
    await update({});
    await new Promise((r) => setTimeout(r, 800));
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Painel esquerdo */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 text-white">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Link<span className="text-indigo-200">Commerce</span>
        </Link>

        <div className="space-y-5">
          {[
            { id: "conta",    label: "Criar conta",         desc: "Nome, email e senha" },
            { id: "template", label: "Escolher template",   desc: "Estilo visual da loja" },
            { id: "loja",     label: "Configurar loja",     desc: "Nome e endereço" },
          ].map((s, i) => {
            const cur = STEP_ORDER.indexOf(step);
            const idx = STEP_ORDER.indexOf(s.id as Step);
            const done = idx < cur;
            const active = idx === cur;
            return (
              <div key={s.id} className="flex items-start gap-4">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold border-2 transition-all ${done ? "bg-white text-indigo-600 border-white" : active ? "bg-indigo-500 border-white text-white" : "border-indigo-400 text-indigo-300"}`}>
                  {done ? "✓" : i + 1}
                </div>
                <div>
                  <p className={`font-semibold ${active ? "text-white" : done ? "text-indigo-100" : "text-indigo-300"}`}>{s.label}</p>
                  <p className="text-xs text-indigo-300">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-indigo-300 text-xs">© {new Date().getFullYear()} LinkCommerce</p>
      </div>

      {/* Painel direito */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-lg">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4">
            ← Página inicial
          </Link>
          <Link href="/" className="lg:hidden block text-xl font-bold text-slate-900 mb-8 text-center">
            Link<span className="text-indigo-600">Commerce</span>
          </Link>

          {/* ── CONTA ── */}
          {step === "conta" && (
            <>
              <div className="mb-6">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Passo 1 de 3</p>
                <h1 className="text-2xl font-bold text-slate-900">Criar conta</h1>
                <p className="mt-1 text-sm text-slate-500">Já tem conta? <Link href="/entrar" className="font-semibold text-indigo-600 hover:underline">Entrar</Link></p>
              </div>
              {erro && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{erro}</div>}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <form onSubmit={handleCriarConta} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
                    <input name="nome" type="text" placeholder="Ana Pereira" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input name="email" type="email" placeholder="ana@exemplo.com" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                    <input name="password" type="password" placeholder="Mínimo 6 caracteres" required minLength={6} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                    {loading ? "A criar conta..." : "Continuar →"}
                  </button>
                </form>
              </div>
            </>
          )}

          {/* ── TEMPLATE ── */}
          {step === "template" && (
            <>
              <div className="mb-6">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Passo 2 de 3</p>
                <h1 className="text-2xl font-bold text-slate-900">Escolha o estilo da sua loja</h1>
                <p className="mt-1 text-sm text-slate-500">Personalize as cores em Configurações depois.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {TEMPLATES.map((t) => (
                  <button key={t.id} type="button" onClick={() => setTemplateSel(t.id)}
                    className={`rounded-2xl border-2 overflow-hidden text-left transition-all ${templateSel === t.id ? "border-indigo-600 shadow-lg shadow-indigo-100" : "border-slate-200 hover:border-slate-300"}`}>
                    <div className="h-16 flex" style={{ backgroundColor: t.bg }}>
                      <div className="w-1/3" style={{ backgroundColor: t.cor, opacity: 0.7 }} />
                      <div className="flex-1 flex flex-col justify-end p-2 gap-1">
                        <div className="h-1.5 rounded-full bg-white/30 w-3/4" />
                        <div className="h-1.5 rounded-full bg-white/20 w-1/2" />
                      </div>
                    </div>
                    <div className="p-2.5 bg-white">
                      <p className="text-xs font-semibold text-slate-800">{t.emoji} {t.label}</p>
                      <p className="text-xs text-slate-400">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep("conta")} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">← Voltar</button>
                <button onClick={() => setStep("loja")} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                  Continuar com {TEMPLATES.find(t => t.id === templateSel)?.label} →
                </button>
              </div>
            </>
          )}

          {/* ── LOJA ── */}
          {step === "loja" && (
            <>
              <div className="mb-6">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Passo 3 de 3</p>
                <h1 className="text-2xl font-bold text-slate-900">Detalhes da loja</h1>
                <p className="mt-1 text-sm text-slate-500">O endereço não pode ser alterado depois.</p>
              </div>
              {erro && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{erro}</div>}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <form onSubmit={handleCriarLoja} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome da loja</label>
                    <input name="nome" type="text" placeholder="Ex: Boutique da Ana" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Endereço da loja</label>
                    <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                      <input name="subdominio" type="text" placeholder="boutique-ana" required pattern="[a-zA-Z0-9-]+" className="flex-1 px-4 py-2.5 text-sm outline-none" />
                      <span className="flex items-center border-l px-3 text-xs text-slate-400 bg-slate-50">.linkcommerce.app</span>
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-100 text-xs">
                    <div className="px-3 py-2 text-white font-medium" style={{ backgroundColor: CORES[templateSel].corPrimaria }}>
                      {TEMPLATES.find(t => t.id === templateSel)?.emoji} {TEMPLATES.find(t => t.id === templateSel)?.label}
                    </div>
                    <div className="flex gap-3 px-3 py-2 bg-slate-50 text-slate-500">
                      <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full border inline-block" style={{ backgroundColor: CORES[templateSel].corPrimaria }} />{CORES[templateSel].corPrimaria}</span>
                      <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full border inline-block" style={{ backgroundColor: CORES[templateSel].corSecundaria }} />{CORES[templateSel].corSecundaria}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => { setStep("template"); setErro(""); }} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">← Voltar</button>
                    <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                      {loading ? "A criar..." : "Lançar a minha loja 🚀"}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

          {/* ── LOADING ── */}
          {step === "loading" && (
            <div className="text-center space-y-4 py-16">
              <div className="mx-auto h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg className="h-8 w-8 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">A lançar a sua loja…</h2>
              <p className="text-sm text-slate-500">Só um momento!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
