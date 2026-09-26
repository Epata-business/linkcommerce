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
  const limite48h = new Date(agora.getTime() - 48 * 60 * 60 * 1000);

  const [
    produtosStockBaixo,
    produtosEsgotados,
    pedidosPendentesAntigos,
    receitaPeriodo,
    receitaAnterior,
    avaliacoesPendentes,
    multicaixaPendente24h,
    pedidosProcessingSemEnvio,
  ] = await Promise.all([
    // Produtos com stock disponível abaixo ou igual ao mínimo (mas ainda > 0)
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count
      FROM "produtos"
      WHERE "lojaId" = ${lojaId}
        AND ativo = true
        AND "stockMinimo" > 0
        AND (stock - "stockReservado") > 0
        AND (stock - "stockReservado") <= "stockMinimo"
    `.then(r => Number(r[0]?.count ?? 0)),

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
      where: { lojaId, status: "PENDING", createdAt: { lt: limite24h } },
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

    // Avaliações pendentes de moderação
    prisma.avaliacao.count({ where: { lojaId, aprovada: false } }),

    // Pedidos Multicaixa com pagamento PENDENTE há mais de 24h (sem comprovativo confirmado)
    prisma.pagamento.count({
      where: {
        lojaId,
        metodo: "MULTICAIXA",
        status: "PENDENTE",
        criadoEm: { lt: limite24h },
      },
    }),

    // Pedidos em PROCESSING há mais de 3 dias sem código de rastreio
    prisma.pedido.count({
      where: {
        lojaId,
        status: "PROCESSING",
        codigoRastreio: null,
        updatedAt: { lt: new Date(agora.getTime() - 3 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const alertas: Alerta[] = [];

  // ── 🔴 Crítico ──────────────────────────────────────────────────────────────

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

  if (multicaixaPendente24h > 0) {
    alertas.push({
      prioridade: "critico",
      icone: "💳",
      titulo: `${multicaixaPendente24h} pagamento${multicaixaPendente24h > 1 ? "s" : ""} Multicaixa sem confirmação há mais de 24h`,
      descricao: "O stock está reservado. Confirme o comprovativo ou cancele o pedido.",
      href: "/dashboard/pedidos?status=pending",
      cta: "Verificar →",
    });
  }

  // ── 🟠 Atenção ──────────────────────────────────────────────────────────────

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

  if (pedidosProcessingSemEnvio > 0) {
    alertas.push({
      prioridade: "atencao",
      icone: "🚚",
      titulo: `${pedidosProcessingSemEnvio} pedido${pedidosProcessingSemEnvio > 1 ? "s" : ""} em processamento sem código de rastreio`,
      descricao: "Em processamento há mais de 3 dias sem expedição registada.",
      href: "/dashboard/envios",
      cta: "Expedir →",
    });
  }

  // Queda de receita ≥ 20%
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

  // ── 🔵 Informação ────────────────────────────────────────────────────────────

  if (avaliacoesPendentes > 0) {
    alertas.push({
      prioridade: "info",
      icone: "⭐",
      titulo: `${avaliacoesPendentes} avaliação${avaliacoesPendentes > 1 ? "ões" : ""} à espera de moderação`,
      descricao: "Reveja e publique as avaliações dos seus clientes.",
      href: "/dashboard/avaliacoes?filtro=pendentes",
      cta: "Moderar →",
    });
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
              <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
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
