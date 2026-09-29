"use client";

import { useState } from "react";

type Step = "inserir" | "dns" | "verificar";

interface Props {
  dominioActual: string | null;
  onSave: (formData: FormData) => Promise<void>;
}

export function DomainWizard({ dominioActual, onSave }: Props) {
  const [passo, setPasso] = useState<Step>(dominioActual ? "dns" : "inserir");
  const [dominio, setDominio] = useState(dominioActual ?? "");
  const [dominioGuardado, setDominioGuardado] = useState(dominioActual ?? "");
  const [guardando, setGuardando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [resultadoDns, setResultadoDns] = useState<"ok" | "nok" | null>(null);

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    const d = dominio.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!d) return;
    if (d.includes(" ") || d.includes("/")) { alert("Domínio inválido. Exemplo: loja.meusite.ao"); return; }
    setGuardando(true);
    const fd = new FormData();
    fd.set("dominioProprio", d);
    await onSave(fd).catch(() => null);
    setDominioGuardado(d);
    setDominio(d);
    setGuardando(false);
    setResultadoDns(null);
    setPasso("dns");
  }

  async function handleRemover() {
    if (!confirm("Remover o domínio próprio?")) return;
    setGuardando(true);
    const fd = new FormData();
    fd.set("dominioProprio", "");
    await onSave(fd).catch(() => null);
    setDominioGuardado("");
    setDominio("");
    setGuardando(false);
    setPasso("inserir");
  }

  async function handleVerificar() {
    setVerificando(true);
    setResultadoDns(null);
    try {
      const res = await fetch(`/api/loja/verificar-dns?dominio=${encodeURIComponent(dominioGuardado)}`);
      const data = await res.json();
      setResultadoDns(data.propagado ? "ok" : "nok");
    } catch {
      setResultadoDns("nok");
    }
    setVerificando(false);
  }

  return (
    <div className="space-y-4">
      {/* Indicador de passos */}
      <div className="flex items-center gap-2 mb-2">
        {(["inserir", "dns", "verificar"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => { if (dominioGuardado || s === "inserir") setPasso(s); }}
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${
                passo === s
                  ? "bg-indigo-600 text-white"
                  : dominioGuardado
                  ? "bg-slate-200 text-slate-600 hover:bg-indigo-100 cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-default"
              }`}
            >
              {i + 1}
            </button>
            {i < 2 && <div className="h-px w-6 bg-slate-200" />}
          </div>
        ))}
        <span className="ml-2 text-xs text-slate-400">
          {passo === "inserir" && "Inserir domínio"}
          {passo === "dns" && "Configurar DNS"}
          {passo === "verificar" && "Verificar propagação"}
        </span>
      </div>

      {/* Passo 1 — Inserir domínio */}
      {passo === "inserir" && (
        <form onSubmit={handleGuardar} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Domínio (sem https://)
            </label>
            <input
              value={dominio}
              onChange={e => setDominio(e.target.value)}
              placeholder="loja.meusite.ao"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-mono focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <p className="mt-1 text-xs text-slate-400">
              Pode usar um subdomínio como <code>loja.meusite.ao</code> ou o domínio raiz <code>meusite.ao</code>.
            </p>
          </div>
          <button
            type="submit"
            disabled={guardando || !dominio.trim()}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {guardando ? "A guardar…" : "Continuar →"}
          </button>
        </form>
      )}

      {/* Passo 2 — DNS */}
      {passo === "dns" && dominioGuardado && (
        <div className="space-y-4">
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 space-y-3">
            <p className="text-sm font-semibold text-blue-900">Adicione este registo DNS no seu painel de domínios:</p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono border-collapse">
                <thead>
                  <tr className="text-blue-700">
                    <th className="text-left pr-4 pb-1">Tipo</th>
                    <th className="text-left pr-4 pb-1">Nome / Host</th>
                    <th className="text-left pb-1">Valor / Destino</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white rounded">
                    <td className="pr-4 py-2 text-indigo-700 font-bold">CNAME</td>
                    <td className="pr-4 py-2 text-slate-600">{dominioGuardado.includes(".") ? dominioGuardado.split(".")[0] : "@"}</td>
                    <td className="py-2 text-slate-800">cname.vercel-dns.com</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-blue-700">
              Se estiver a usar o domínio raiz (<code>{dominioGuardado}</code> sem subdomínio), alguns registadores pedem um registo <strong>ALIAS</strong> ou <strong>ANAME</strong> em vez de CNAME.
            </p>
            <p className="text-xs text-blue-600">
              A propagação DNS pode demorar até <strong>48 horas</strong>. Após propagar, a sua loja estará disponível em <strong>https://{dominioGuardado}</strong>.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setPasso("verificar")}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Verificar propagação →
            </button>
            <button
              onClick={() => setPasso("inserir")}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Alterar domínio
            </button>
            <button
              onClick={handleRemover}
              disabled={guardando}
              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Remover domínio
            </button>
          </div>
        </div>
      )}

      {/* Passo 3 — Verificar */}
      {passo === "verificar" && dominioGuardado && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            A verificar se <strong>{dominioGuardado}</strong> aponta correctamente para a LinkCommerce.
          </p>

          {resultadoDns === "ok" && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-sm font-bold text-green-800">DNS propagado com sucesso!</p>
                <p className="text-xs text-green-700 mt-0.5">
                  A sua loja está a ser servida em <a href={`https://${dominioGuardado}`} target="_blank" rel="noopener noreferrer" className="underline font-semibold">https://{dominioGuardado}</a>.
                </p>
              </div>
            </div>
          )}

          {resultadoDns === "nok" && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-bold text-amber-800">DNS ainda não propagado</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Certifique-se de que adicionou o registo CNAME correctamente. A propagação pode demorar até 48h. Tente novamente mais tarde.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleVerificar}
              disabled={verificando}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {verificando ? "A verificar…" : resultadoDns ? "Verificar novamente" : "Verificar agora"}
            </button>
            <button
              onClick={() => setPasso("dns")}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              ← Ver instruções DNS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
