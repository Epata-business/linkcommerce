export const MOEDAS = [
  { codigo: "EUR", simbolo: "€", nome: "Euro", locale: "pt-PT" },
  { codigo: "USD", simbolo: "$", nome: "Dólar Americano", locale: "en-US" },
  { codigo: "AOA", simbolo: "Kz", nome: "Kwanza Angolano", locale: "pt-AO" },
] as const;

export type CodigoMoeda = (typeof MOEDAS)[number]["codigo"];

export function formatarPreco(valor: number | string, moeda: string = "EUR"): string {
  const num = typeof valor === "string" ? parseFloat(valor) : valor;
  if (isNaN(num)) return "—";

  const m = MOEDAS.find((x) => x.codigo === moeda);

  if (moeda === "AOA") {
    // Kwanza: sem decimais por convenção, ex: "1.250 Kz"
    return `${num.toLocaleString("pt-AO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Kz`;
  }

  return num.toLocaleString(m?.locale ?? "pt-PT", {
    style: "currency",
    currency: moeda,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
