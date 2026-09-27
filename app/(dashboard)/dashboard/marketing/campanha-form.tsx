"use client";

import { useState, useTransition } from "react";
import { criarCampanha } from "./campanhas-actions";

export function CampanhaForm() {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await criarCampanha(fd);
      if (res?.erro) setErro(res.erro);
      else (e.target as HTMLFormElement).reset();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nome interno</label>
        <input name="nome" required placeholder="Promoção de Setembro" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Assunto do email</label>
        <input name="assunto" required placeholder="Novidades da nossa loja!" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Corpo (HTML ou texto simples)</label>
        <textarea
          name="corpo"
          required
          rows={8}
          placeholder={`<h1>Olá {{nome}},</h1>\n<p>Temos novidades para si...</p>`}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-slate-400">Pode usar HTML. O link de cancelamento de subscrição é adicionado automaticamente.</p>
      </div>
      {erro && <p className="text-xs text-red-500">{erro}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">
        {pending ? "A guardar..." : "Guardar rascunho"}
      </button>
    </form>
  );
}
