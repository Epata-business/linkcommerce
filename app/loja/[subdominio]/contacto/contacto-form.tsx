"use client";

import { useFormState, useFormStatus } from "react-dom";
import { enviarMensagemContacto } from "./action";

function SubmitButton({ cor, label }: { cor: string; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
      style={{ background: `linear-gradient(135deg,${cor},${cor}bb)` }}>
      {pending
        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />A enviar…</>
        : label}
    </button>
  );
}

export function ContactoForm({ subdominio, cor, labels }: {
  subdominio: string;
  cor: string;
  labels: { nome: string; email: string; assunto: string; msg: string; btn: string; ph_nome: string; ph_assunto: string; ph_msg: string };
}) {
  const [state, action] = useFormState(enviarMensagemContacto, null);

  if (state?.sucesso) {
    return (
      <div className="rounded-2xl border border-green-100 bg-green-50 p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <p className="font-bold text-green-800 text-lg">Mensagem enviada!</p>
        <p className="text-green-600 text-sm mt-1">O lojista receberá a sua mensagem e responderá em breve.</p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <input type="hidden" name="subdominio" value={subdominio} />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{labels.nome}</label>
          <input name="nome" type="text" placeholder={labels.ph_nome} required
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{labels.email}</label>
          <input name="email" type="email" placeholder="email@exemplo.com" required
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{labels.assunto}</label>
        <input name="assunto" type="text" placeholder={labels.ph_assunto} required
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{labels.msg}</label>
        <textarea name="mensagem" rows={5} placeholder={labels.ph_msg} required
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
      </div>

      {state?.erro && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{state.erro}</div>
      )}

      <SubmitButton cor={cor} label={labels.btn} />
    </form>
  );
}
