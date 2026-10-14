"use client";

// Reserva de horário (prova privada no atelier / atendimento de concierge).
// Não guarda nada na plataforma: abre o WhatsApp da loja com o horário escolhido,
// ou a página de contacto quando a loja não tem WhatsApp configurado.
import { useEffect, useState } from "react";
import { CONFIG_ALTO_PADRAO, type SlugAltoPadrao } from "@/lib/temas-alto-padrao";
import { linkContacto, preencher } from "./util";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const ESTILOS: Record<SlugAltoPadrao, { slot: string; slotSel: string; dia: string; hora: string; botao: string; nota: string }> = {
  "maison-ndala": {
    slot: "border border-white/15 px-3 py-3 text-left transition hover:border-white/40",
    slotSel: "!border-white bg-white/10",
    dia: "text-[10px] uppercase tracking-[0.15em] text-white/50",
    hora: "mt-1 text-sm text-white",
    botao: "w-full h-12 bg-[#F8F6F1] text-[#141414] text-xs uppercase tracking-[0.25em] transition disabled:opacity-40",
    nota: "text-xs text-white/60",
  },
  aurea: {
    slot: "border border-[#D4B26A33] px-3 py-3 text-left transition hover:border-[#D4B26A88]",
    slotSel: "!border-[#D4B26A] bg-[#D4B26A1A]",
    dia: "text-[10px] uppercase tracking-[0.2em] text-[#9DB3A8]",
    hora: "mt-1 text-sm text-[#F1E9D8]",
    botao: "w-full h-12 bg-[#C9A45C] text-[#0F2A22] text-xs font-semibold uppercase tracking-[0.25em] transition disabled:opacity-40",
    nota: "text-xs text-[#9DB3A8]",
  },
  "casa-mussulo": {
    slot: "rounded-xl border border-white/15 px-3 py-3 text-left transition hover:border-white/40",
    slotSel: "!border-white bg-white/10",
    dia: "text-[11px] text-white/60",
    hora: "mt-1 text-sm font-semibold text-white",
    botao: "w-full h-12 rounded-full bg-[#F2F2EF] text-[#1D2522] text-sm font-semibold transition disabled:opacity-40",
    nota: "text-xs text-white/60",
  },
};

export function Marcacao({ slug, telefoneWA, subdominio }: { slug: SlugAltoPadrao; telefoneWA: string | null; subdominio: string }) {
  const m = CONFIG_ALTO_PADRAO[slug].marcacao;
  const e = ESTILOS[slug];
  const [horarios, setHorarios] = useState<{ dia: string; hora: string }[]>([]);
  const [escolhido, setEscolhido] = useState<number | null>(null);
  const [enviado, setEnviado] = useState(false);

  // Gerado no browser para usar a data local do cliente (e não a do servidor).
  useEffect(() => {
    if (!m) return;
    const lista: { dia: string; hora: string }[] = [];
    const d = new Date();
    while (lista.length < m.dias * m.horas.length) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0) continue; // domingo fechado
      for (const hora of m.horas) lista.push({ dia: `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`, hora });
    }
    setHorarios(lista);
  }, [m]);

  if (!m) return null;
  const sel = escolhido != null ? horarios[escolhido] : null;
  const horario = sel ? `${sel.dia}, às ${sel.hora}` : "";

  function reservar() {
    if (!m || !sel) return;
    const url = linkContacto(telefoneWA, preencher(m.mensagem, { horario }), subdominio);
    setEnviado(true);
    if (url.startsWith("http")) window.open(url, "_blank", "noopener,noreferrer");
    else window.location.href = url;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 min-h-[132px]">
        {horarios.map((h, i) => (
          <button
            key={`${h.dia}-${h.hora}`}
            type="button"
            aria-pressed={escolhido === i}
            onClick={() => { setEscolhido(i); setEnviado(false); }}
            className={`${e.slot} ${escolhido === i ? e.slotSel : ""}`}
          >
            <p className={e.dia}>{h.dia}</p>
            <p className={e.hora}>{h.hora}</p>
          </button>
        ))}
      </div>
      <button type="button" onClick={reservar} disabled={!sel} className={e.botao}>
        {m.botao}
      </button>
      {enviado && sel && <p className={e.nota}>{preencher(m.confirmacao, { horario })}</p>}
    </div>
  );
}
