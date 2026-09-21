"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface Props {
  nome: string | null;
  email: string;
  image: string | null;
  temSenha: boolean;
}

export function PerfilForm({ nome, email, image, temSenha }: Props) {
  const [tab, setTab] = useState<"perfil" | "senha">("perfil");

  // Perfil
  const [nomeVal, setNomeVal] = useState(nome ?? "");
  const [imageUrl, setImageUrl] = useState(image ?? "");
  const [uploading, setUploading] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [msgPerfil, setMsgPerfil] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [msgSenha, setMsgSenha] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [mostrarSenhas, setMostrarSenhas] = useState(false);

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("ficheiro", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (data.url) setImageUrl(data.url);
    else setMsgPerfil({ tipo: "erro", texto: "Erro ao carregar a foto." });
    setUploading(false);
  }

  async function handleSalvarPerfil(e: React.FormEvent) {
    e.preventDefault();
    setSalvandoPerfil(true);
    setMsgPerfil(null);
    const res = await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "perfil", nome: nomeVal, image: imageUrl }),
    });
    const data = await res.json();
    if (data.ok) setMsgPerfil({ tipo: "ok", texto: "Perfil actualizado com sucesso." });
    else setMsgPerfil({ tipo: "erro", texto: data.erro ?? "Erro ao guardar." });
    setSalvandoPerfil(false);
  }

  async function handleAlterarSenha(e: React.FormEvent) {
    e.preventDefault();
    setMsgSenha(null);
    if (novaSenha !== confirmarSenha) {
      setMsgSenha({ tipo: "erro", texto: "As senhas não coincidem." });
      return;
    }
    if (novaSenha.length < 8) {
      setMsgSenha({ tipo: "erro", texto: "A senha deve ter pelo menos 8 caracteres." });
      return;
    }
    setSalvandoSenha(true);
    const res = await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "senha", senhaAtual, novaSenha }),
    });
    const data = await res.json();
    if (data.ok) {
      setMsgSenha({ tipo: "ok", texto: "Senha alterada com sucesso." });
      setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha("");
    } else {
      setMsgSenha({ tipo: "erro", texto: data.erro ?? "Erro ao alterar senha." });
    }
    setSalvandoSenha(false);
  }

  const initials = (nomeVal || email).slice(0, 2).toUpperCase();

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {(["perfil", "senha"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {t === "perfil" ? "Dados pessoais" : "Segurança"}
          </button>
        ))}
      </div>

      {/* Tab: Perfil */}
      {tab === "perfil" && (
        <form onSubmit={handleSalvarPerfil} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              {imageUrl ? (
                <Image src={imageUrl} alt="Foto de perfil" width={80} height={80}
                  className="h-20 w-20 rounded-full object-cover border-2 border-slate-200" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-bold border-2 border-slate-200">
                  {initials}
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                {uploading ? "A carregar…" : "Alterar foto"}
              </button>
              {imageUrl && (
                <button type="button" onClick={() => setImageUrl("")}
                  className="ml-2 text-sm text-red-500 hover:text-red-700 transition-colors">
                  Remover
                </button>
              )}
              <p className="mt-1 text-xs text-slate-400">JPG, PNG ou WebP · máx. 5 MB</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
            <input value={nomeVal} onChange={e => setNomeVal(e.target.value)}
              placeholder="O teu nome"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="flex items-center gap-2">
              <input value={email} readOnly
                className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed" />
              <span className="text-xs text-slate-400 shrink-0">Não editável</span>
            </div>
          </div>

          {msgPerfil && (
            <div className={`rounded-xl px-4 py-3 text-sm ${msgPerfil.tipo === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
              {msgPerfil.texto}
            </div>
          )}

          <button type="submit" disabled={salvandoPerfil}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
            {salvandoPerfil ? "A guardar…" : "Guardar alterações"}
          </button>
        </form>
      )}

      {/* Tab: Senha */}
      {tab === "senha" && (
        <div>
          {!temSenha ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-700">Conta com login social</p>
              <p className="text-xs text-slate-400 mt-1">A tua conta usa Google ou GitHub para autenticação — não tens senha definida.</p>
            </div>
          ) : (
            <form onSubmit={handleAlterarSenha} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Senha actual</label>
                <div className="relative">
                  <input type={mostrarSenhas ? "text" : "password"} value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm pr-10 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nova senha</label>
                <input type={mostrarSenhas ? "text" : "password"} value={novaSenha} onChange={e => setNovaSenha(e.target.value)} required minLength={8}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
                <p className="mt-1 text-xs text-slate-400">Mínimo 8 caracteres</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar nova senha</label>
                <input type={mostrarSenhas ? "text" : "password"} value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} required
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${confirmarSenha && novaSenha !== confirmarSenha ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"}`} />
                {confirmarSenha && novaSenha !== confirmarSenha && (
                  <p className="mt-1 text-xs text-red-500">As senhas não coincidem</p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer select-none">
                <input type="checkbox" checked={mostrarSenhas} onChange={e => setMostrarSenhas(e.target.checked)} className="rounded" />
                Mostrar senhas
              </label>

              {msgSenha && (
                <div className={`rounded-xl px-4 py-3 text-sm ${msgSenha.tipo === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                  {msgSenha.texto}
                </div>
              )}

              <button type="submit" disabled={salvandoSenha || novaSenha !== confirmarSenha}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                {salvandoSenha ? "A alterar…" : "Alterar senha"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
