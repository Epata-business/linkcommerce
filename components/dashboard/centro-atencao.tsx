import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarVariacao } from "@/lib/periodo";

interface Alerta {
  prioridade: "critico" | "atencao" | "info";
  icone: string;
  titulo: string;
  descricao: string;
  href: string;
  cta: string;
}

const PRIORIDADE_CONFIG = {
  critico: { dot: "bg-red-500",    bg: "bg-red-50",    border: "border-red-100",   text: "text-red-700",   badge: "🔴" },
  atencao: { dot: "bg-amber-400",  bg: "bg-amber-50",  border: "border-amber-100", text: "text-amber-700", badge: "🟠" },
  info:    { dot: "bg-blue-400",   bg: "bg-blue-50",   border: "border-blue-100",  text: "text-blue-700",  badge: "🔵" },
};

interface Props {
  lojaId: string;
  inicio: Date;
  fim: Date;
  inicioAnterior: Date;
  fimAnterior: Date;
}

export async function CentroAtencao({ lojaId, inicio, fim, inicioAnterior, fimAnterior }: Props) {
  const agora = new Date();
  const limite24h = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

  const [
    produtosStockBaixo,
    produtosEsgotados,
    pedidosPendentesAntigos,
    receitaPeriodo,
    receitaAnterior,
  ] = await Promise.all([
    // Produtos com stock disponível abaixo ou igual ao mínimo (mas ainda > 0)
    prisma.produto.count({
      where: {
        lojaId,
        ativo: true,
        stockMinimo: { gt: 0 },
        AND: [
          { stock: { gt: 0 } },
        ],
      },
    }).then(async () => {
      // Prisma não suporta stock - stockReservado directamente num where,
      // por isso fazemos a query raw agregada no mesmo pedido
      const result = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint as count
        FROM "produtos"
        WHERE "lojaId" = ${lojaId}
          AND ativo = true
          AND "stockMinimo" > 0
          AND (stock - "stockReservado") > 0
          AND (stock - "stockReservado") <= "stockMinimo"
      `;
      return Number(result[0]?.count ?? 0);
    }),

    // Produtos com stock disponível ≤ 0 e activos
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count
      FROM "produtos"
      WHERE "lojaId" = ${lojaId}
        AND ativo = true
        AND (stock - "stockReservado") <= 0
    `.then(r => Number(r[0]?.count ?? 0)),

    // Pedidos PENDING há mais de 24h
    prisma.pedido.count({
      where: {
        lojaId,
        status: "PENDING",
        createdAt: { lt: limite24h },
      },
    }),

    // Receita no período seleccionado
    prisma.pedido.aggregate({
      where: { lojaId, createdAt: { gte: inicio, lte: fim }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),

    // Receita no período de comparação
    prisma.pedido.aggregate({
      where: { lojaId, createdAt: { gte: inicioAnterior, lte: fimAnterior }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
  ]);

  const alertas: Alerta[] = [];

  // --- Alertas state-based ---

  if (produtosEsgotados > 0) {
    alertas.push({
      prioridade: "critico",
      icone: "📦",
      titulo: `${produtosEsgotados} produto${produtosEsgotados > 1 ? "s" : ""} sem stock`,
      descricao: `${produtosEsgotados > 1 ? "Estão" : "Está"} esgotado${produtosEsgotados > 1 ? "s" : ""} e não ${produtosEsgotados > 1 ? "podem" : "pode"} ser comprado${produtosEsgotados > 1 ? "s" : ""}.`,
      href: "/dashboard/produtos",
      cta: "Repor stock →",
    });
  }

  if (pedidosPendentesAntigos > 0) {
    alertas.push({
      prioridade: "critico",
      icone: "⏰",
      titulo: `${pedidosPendentesAntigos} pedido${pedidosPendentesAntigos > 1 ? "s" : ""} pendente${pedidosPendentesAntigos > 1 ? "s" : ""} há mais de 24h`,
      descricao: "Pedidos sem processamento podem indicar problemas de pagamento.",
      href: "/dashboard/pedidos?status=pending",
      cta: "Ver pedidos →",
    });
  }

  if (produtosStockBaixo > 0) {
    alertas.push({
      prioridade: "atencao",
      icone: "⚠️",
      titulo: `${produtosStockBaixo} produto${produtosStockBaixo > 1 ? "s" : ""} com stock baixo`,
      descricao: "Stock disponível abaixo do mínimo definido.",
      href: "/dashboard/produtos",
      cta: "Ver produtos →",
    });
  }

  // --- Alertas time-based ---

  const recAtual = Number(receitaPeriodo._sum.total ?? 0);
  const recAnterior = Number(receitaAnterior._sum.total ?? 0);
  const { texto: textoVariacao, positivo } = formatarVariacao(recAtual, recAnterior);

  if (recAnterior > 0 && positivo === false) {
    const queda = ((recAnterior - recAtual) / recAnterior) * 100;
    if (queda >= 20) {
      alertas.push({
        prioridade: queda >= 40 ? "critico" : "atencao",
        icone: "📉",
        titulo: `Receita caiu ${queda.toFixed(0)}% vs período anterior`,
        descricao: textoVariacao,
        href: "/dashboard/relatorios",
        cta: "Ver relatórios →",
      });
    }
  }

  if (alertas.length === 0) return null;

  // Ordenar por prioridade
  const ordem = { critico: 0, atencao: 1, info: 2 };
  alertas.sort((a, b) => ordem[a.prioridade] - ordem[b.prioridade]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <span className="text-base">🎯</span>
        <h2 className="font-bold text-slate-800">Centro de Atenção</h2>
        <span className="ml-auto text-xs font-bold bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
          {alertas.length}
        </span>
      </div>
      <div className="divide-y divide-slate-50">
        {alertas.map((a, i) => {
          const cfg = PRIORIDADE_CONFIG[a.prioridade];
          return (
            <div key={i} className={`flex items-start gap-3 px-5 py-3.5 ${cfg.bg}`}>
              <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${cfg.text}`}>{a.icone} {a.titulo}</p>
                <p className="text-xs text-slate-500 mt-0.5">{a.descricao}</p>
              </div>
              <Link
                href={a.href}
                className={`flex-shrink-0 text-xs font-bold ${cfg.text} hover:underline`}
              >
                {a.cta}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
