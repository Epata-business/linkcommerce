import { prisma } from "@/lib/prisma";

// -----------------------------------------------------------------------------
// ARREDONDAMENTO PÚBLICO
// Transforma o valor interno num valor aproximado para comunicação pública.
// Nunca arredonda para cima — sempre para baixo (conservador).
//
// Exemplos:
//   12847 → "+12K"    |    342 → "+300"    |    47 → "+40"    |    6 → "6"
// -----------------------------------------------------------------------------
export function arredondarPublico(n: number): string {
  if (n <= 0) return "0";
  if (n >= 1_000_000) return `+${Math.floor(n / 1_000_000)}M`;
  if (n >= 1_000)     return `+${Math.floor(n / 1_000)}K`;
  if (n >= 100)       return `+${Math.floor(n / 100) * 100}`;
  if (n >= 10)        return `+${Math.floor(n / 10) * 10}`;
  return `${n}`; // exacto quando muito pequeno
}

// -----------------------------------------------------------------------------
// CRESCIMENTO PERCENTUAL
// Retorna null quando:
//   - período anterior < 10 (amostra insuficiente)
//   - período anterior = 0 (divisão por zero)
//   - crescimento > 1000% (spike inválido — usar "Novo" em vez de %)
// -----------------------------------------------------------------------------
const THRESHOLD_MINIMO = 10;
const SPIKE_MAXIMO = 1000;

export type ResultadoCrescimento =
  | { tipo: "percentagem"; valor: number; label: string }   // +24%
  | { tipo: "novo" }                                         // sem período anterior suficiente mas há actividade
  | { tipo: "insuficiente" };                                // esconder

function calcularCrescimento(actual: number, anterior: number): ResultadoCrescimento {
  if (anterior < THRESHOLD_MINIMO) {
    return actual > 0 ? { tipo: "novo" } : { tipo: "insuficiente" };
  }
  const pct = ((actual - anterior) / anterior) * 100;
  if (pct > SPIKE_MAXIMO) return { tipo: "novo" };
  return { tipo: "percentagem", valor: Math.round(pct), label: pct >= 0 ? `+${Math.round(pct)}%` : `${Math.round(pct)}%` };
}

// -----------------------------------------------------------------------------
// MÉTRICAS PÚBLICAS — cacheadas pelo Next.js (revalidar a cada hora)
// Nunca expõem IDs, emails, nomes ou dados individuais.
// -----------------------------------------------------------------------------
export type MetricaPublica = {
  valor: string;          // ex: "6" ou "+12K"
  label: string;          // ex: "LOJAS ACTIVAS"
  sublabel?: string;      // ex: "Todo o tempo"
  mostrar: boolean;       // false = não renderizar o bloco
};

export async function calcularMetricasPublicas(): Promise<MetricaPublica[]> {
  const agora = new Date();
  const inicioMesActual = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);

  const [
    lojasActivas,
    pedidosValidos,
    lojasCriadasMesActual,
    lojasCriadasMesAnterior,
    viewsMesActual,
    viewsMesAnterior,
  ] = await Promise.all([
    prisma.loja.count({ where: { publicada: true } }),
    prisma.pedido.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.loja.count({ where: { createdAt: { gte: inicioMesActual } } }),
    prisma.loja.count({ where: { createdAt: { gte: inicioMesAnterior, lt: inicioMesActual } } }),
    prisma.eventoPlataforma.count({ where: { tipo: "store_view", dia: { gte: inicioMesActual } } }),
    prisma.eventoPlataforma.count({ where: { tipo: "store_view", dia: { gte: inicioMesAnterior, lt: inicioMesActual } } }),
  ]);

  const crescimentoLojas = calcularCrescimento(lojasCriadasMesActual, lojasCriadasMesAnterior);
  const crescimentoViews = calcularCrescimento(viewsMesActual, viewsMesAnterior);

  const metricas: MetricaPublica[] = [
    // 1. Lojas activas (sempre mostrar se > 0)
    {
      valor: arredondarPublico(lojasActivas),
      label: "LOJAS ACTIVAS",
      sublabel: "Publicadas na plataforma",
      mostrar: lojasActivas > 0,
    },
    // 2. Pedidos realizados (mostrar se > 0)
    {
      valor: arredondarPublico(pedidosValidos),
      label: "PEDIDOS REALIZADOS",
      sublabel: "Status diferente de cancelado",
      mostrar: pedidosValidos > 0,
    },
    // 3. Crescimento de lojas este mês (só se houver dados suficientes)
    {
      valor: crescimentoLojas.tipo === "percentagem" ? crescimentoLojas.label : "Em crescimento",
      label: "CRESCIMENTO DE LOJAS",
      sublabel: "Este mês vs. mês anterior",
      mostrar: crescimentoLojas.tipo !== "insuficiente",
    },
    // 4. Views este mês (só se já tiver histórico suficiente)
    {
      valor: crescimentoViews.tipo === "percentagem" ? crescimentoViews.label : arredondarPublico(viewsMesActual),
      label: crescimentoViews.tipo === "percentagem" ? "CRESCIMENTO DE VIEWS" : "VISUALIZAÇÕES",
      sublabel: crescimentoViews.tipo === "percentagem" ? "Este mês vs. mês anterior" : "Lojas LinkCommerce — este mês",
      mostrar: viewsMesActual > 0,
    },
  ];

  return metricas.filter(m => m.mostrar);
}

// -----------------------------------------------------------------------------
// MÉTRICAS INTERNAS (admin apenas — nunca públicas)
// Inclui valores exactos, volume por moeda, etc.
// -----------------------------------------------------------------------------
export async function calcularMetricasAdmin() {
  const [
    lojasTotal,
    lojasActivas,
    pedidosTodos,
    pedidosValidos,
    pedidosCancelados,
    produtos,
    clientes,
    volumeEUR,
    volumeAOA,
    viewsTotal,
    viewsMes,
    lojasCriadas,
  ] = await Promise.all([
    prisma.loja.count(),
    prisma.loja.count({ where: { publicada: true } }),
    prisma.pedido.count(),
    prisma.pedido.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.pedido.count({ where: { status: "CANCELLED" } }),
    prisma.produto.count({ where: { ativo: true } }),
    prisma.cliente.count(),
    prisma.pedido.aggregate({
      _sum: { total: true },
      where: { status: { not: "CANCELLED" }, loja: { moeda: "EUR" } },
    }),
    prisma.pedido.aggregate({
      _sum: { total: true },
      where: { status: { not: "CANCELLED" }, loja: { moeda: "AOA" } },
    }),
    prisma.eventoPlataforma.count({ where: { tipo: "store_view" } }),
    prisma.eventoPlataforma.count({
      where: {
        tipo: "store_view",
        dia: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.loja.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    }),
  ]);

  return {
    lojas: { total: lojasTotal, activas: lojasActivas, criadasEsteMes: lojasCriadas },
    pedidos: { todos: pedidosTodos, validos: pedidosValidos, cancelados: pedidosCancelados },
    volume: {
      EUR: volumeEUR._sum.total?.toString() ?? "0",
      AOA: volumeAOA._sum.total?.toString() ?? "0",
      aviso: "EUR e AOA nunca somados — moedas diferentes",
    },
    produtos,
    clientes,
    views: { total: viewsTotal, esteMes: viewsMes },
    // Valores públicos que serão exibidos (para comparação admin)
    publico: await calcularMetricasPublicas(),
  };
}
