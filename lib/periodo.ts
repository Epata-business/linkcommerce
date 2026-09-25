/**
 * lib/periodo.ts
 * Calcula intervalos de datas para o filtro temporal do dashboard.
 * Todos os cálculos em UTC para consistência server-side.
 */

export type PeriodoKey = "hoje" | "ontem" | "7d" | "30d" | "mes" | "mes_anterior";

export interface Intervalo {
  inicio: Date;
  fim: Date;
  inicioAnterior: Date;
  fimAnterior: Date;
  label: string;
  dias: number;
}

export const PERIODOS: { key: PeriodoKey; label: string }[] = [
  { key: "hoje",         label: "Hoje" },
  { key: "ontem",        label: "Ontem" },
  { key: "7d",           label: "Últimos 7 dias" },
  { key: "30d",          label: "Últimos 30 dias" },
  { key: "mes",          label: "Este mês" },
  { key: "mes_anterior", label: "Mês anterior" },
];

export function calcularIntervalo(periodo: string | undefined): Intervalo {
  const agora = new Date();
  // Início do dia de hoje (UTC meia-noite)
  const hojeInicio = new Date(agora);
  hojeInicio.setHours(0, 0, 0, 0);
  const hojeFim = new Date(agora);
  hojeFim.setHours(23, 59, 59, 999);

  switch (periodo as PeriodoKey) {
    case "hoje": {
      const anterior = new Date(hojeInicio);
      anterior.setDate(anterior.getDate() - 1);
      const anteriorFim = new Date(anterior);
      anteriorFim.setHours(23, 59, 59, 999);
      return { inicio: hojeInicio, fim: hojeFim, inicioAnterior: anterior, fimAnterior: anteriorFim, label: "Hoje", dias: 1 };
    }
    case "ontem": {
      const inicio = new Date(hojeInicio);
      inicio.setDate(inicio.getDate() - 1);
      const fim = new Date(inicio);
      fim.setHours(23, 59, 59, 999);
      const anterior = new Date(inicio);
      anterior.setDate(anterior.getDate() - 1);
      const anteriorFim = new Date(anterior);
      anteriorFim.setHours(23, 59, 59, 999);
      return { inicio, fim, inicioAnterior: anterior, fimAnterior: anteriorFim, label: "Ontem", dias: 1 };
    }
    case "7d": {
      const inicio = new Date(hojeInicio);
      inicio.setDate(inicio.getDate() - 6);
      const anterior = new Date(inicio);
      anterior.setDate(anterior.getDate() - 7);
      const anteriorFim = new Date(hojeInicio);
      anteriorFim.setDate(anteriorFim.getDate() - 7);
      anteriorFim.setHours(23, 59, 59, 999);
      return { inicio, fim: hojeFim, inicioAnterior: anterior, fimAnterior: anteriorFim, label: "Últimos 7 dias", dias: 7 };
    }
    case "mes_anterior": {
      const inicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
      const fim = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59, 999);
      const anterior = new Date(agora.getFullYear(), agora.getMonth() - 2, 1);
      const anteriorFim = new Date(agora.getFullYear(), agora.getMonth() - 1, 0, 23, 59, 59, 999);
      return { inicio, fim, inicioAnterior: anterior, fimAnterior: anteriorFim, label: "Mês anterior", dias: fim.getDate() };
    }
    case "mes": {
      const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
      const anterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
      const anteriorFim = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59, 999);
      return { inicio, fim: hojeFim, inicioAnterior: anterior, fimAnterior: anteriorFim, label: "Este mês", dias: agora.getDate() };
    }
    // default: últimos 30 dias
    default: {
      const inicio = new Date(hojeInicio);
      inicio.setDate(inicio.getDate() - 29);
      const anterior = new Date(inicio);
      anterior.setDate(anterior.getDate() - 30);
      const anteriorFim = new Date(hojeInicio);
      anteriorFim.setDate(anteriorFim.getDate() - 30);
      anteriorFim.setHours(23, 59, 59, 999);
      return { inicio, fim: hojeFim, inicioAnterior: anterior, fimAnterior: anteriorFim, label: "Últimos 30 dias", dias: 30 };
    }
  }
}

export function formatarVariacao(atual: number, anterior: number): { texto: string; positivo: boolean | null } {
  if (anterior === 0) return { texto: "Sem dados anteriores", positivo: null };
  const pct = ((atual - anterior) / anterior) * 100;
  const sinal = pct >= 0 ? "+" : "";
  return { texto: `${sinal}${pct.toFixed(1)}% vs período anterior`, positivo: pct >= 0 };
}
