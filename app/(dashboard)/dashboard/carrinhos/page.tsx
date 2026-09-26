import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { formatarPreco } from "@/lib/moeda";
import { BackButton } from "@/components/ui/back-button";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { temPermissao } from "@/lib/rbac";

const STATUS_CONFIG = {
  ABANDONADO:    { label: "Abandonado",     bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-400"    },
  EMAIL_ENVIADO: { label: "Email enviado",  bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400"  },
  CONVERTIDO:    { label: "Convertido",     bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-400"  },
  RECUPERADO:    { label: "Recuperado",     bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-400"   },
} as const;

type StatusCarrinho = keyof typeof STATUS_CONFIG;

export default async function CarrinhosPage({
  searchParams,
}: {
  searchParams: { pagina?: string; status?: string };
}) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!temPermissao(role, "carrinhos")) redirect("/dashboard");

  const lojaId = await getLojaId();
  const [loja] = await Promise.all([
    prisma.loja.findUnique({ where: { id: lojaId }, select: { moeda: true, corPrimaria: true } }),
  ]);
  const moeda = loja?.moeda ?? "EUR";
  const cor = loja?.corPrimaria ?? "#153DFC";

  const pagina = Math.max(1, parseInt(searchParams.pagina ?? "1", 10));
  const porPagina = 25;
  const statusFiltro = searchParams.status as StatusCarrinho | undefined;

  const where = {
    lojaId,
    ...(statusFiltro ? { status: statusFiltro } : {}),
  };

  const [total, carrinhos] = await Promise.all([
    prisma.carrinhoAbandonado.count({ where }),
    prisma.carrinhoAbandonado.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
  ]);

  // KPIs
  const [kpiAbandonados, kpiEmailEnviado, kpiConvertidos, kpiReceita] = await Promise.all([
    prisma.carrinhoAbandonado.count({ where: { lojaId, status: "ABANDONADO" } }),
    prisma.carrinhoAbandonado.count({ where: { lojaId, status: "EMAIL_ENVIADO" } }),
    prisma.carrinhoAbandonado.count({ where: { lojaId, status: { in: ["CONVERTIDO", "RECUPERADO"] } } }),
    prisma.carrinhoAbandonado.aggregate({
      where: { lojaId, status: { in: ["CONVERTIDO", "RECUPERADO"] } },
      _sum: { total: true },
    }),
  ]);

  const totalPages = Math.ceil(total / porPagina);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <BackButton href="/dashboard" label="← Dashboard" />

        <div className="mt-4 mb-8">
          <h1 className="text-2xl font-black text-slate-900">Carrinhos Abandonados</h1>
          <p className="text-slate-400 text-sm mt-1">Clientes que iniciaram checkout mas não completaram a compra</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Abandonados", value: kpiAbandonados, color: "text-red-600" },
            { label: "Email enviado", value: kpiEmailEnviado, color: "text-amber-600" },
            { label: "Convertidos", value: kpiConvertidos, color: "text-green-600" },
            { label: "Receita recuperada", value: formatarPreco(Number(kpiReceita._sum.total ?? 0), moeda), color: "text-slate-900" },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-slate-400 mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Filtro de status */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {([undefined, "ABANDONADO", "EMAIL_ENVIADO", "CONVERTIDO"] as const).map(s => (
            <a
              key={s ?? "todos"}
              href={`/dashboard/carrinhos${s ? `?status=${s}` : ""}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFiltro === s
                  ? "text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
              style={statusFiltro === s ? { background: cor } : {}}
            >
              {s ? STATUS_CONFIG[s].label : "Todos"}
            </a>
          ))}
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {carrinhos.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Sem carrinhos{statusFiltro ? ` com estado "${STATUS_CONFIG[statusFiltro].label}"` : ""}.
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {carrinhos.map(c => {
                const cfg = STATUS_CONFIG[c.status as StatusCarrinho] ?? STATUS_CONFIG.ABANDONADO;
                const itens = (c.itens as { titulo: string; quantidade: number; precoUnitario: number }[]);
                return (
                  <div key={c.id} className="px-5 py-4 flex items-start gap-4 flex-wrap sm:flex-nowrap">
                    {/* Email + nome */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{c.clienteNome ?? c.clienteEmail}</p>
                      <p className="text-xs text-slate-400 truncate">{c.clienteEmail}</p>
                      <div className="mt-1.5 text-xs text-slate-500">
                        {itens.slice(0, 3).map((i, idx) => (
                          <span key={idx}>{i.titulo}{idx < Math.min(itens.length, 3) - 1 ? ", " : ""}</span>
                        ))}
                        {itens.length > 3 && <span className="text-slate-400"> +{itens.length - 3}</span>}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-900">{formatarPreco(Number(c.total), moeda)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(c.criadoEm).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0 flex items-center">
                      <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-slate-500">
              {(pagina - 1) * porPagina + 1}–{Math.min(pagina * porPagina, total)} de {total}
            </p>
            <div className="flex gap-2">
              {pagina > 1 && (
                <a href={`/dashboard/carrinhos?pagina=${pagina - 1}${statusFiltro ? `&status=${statusFiltro}` : ""}`}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  ← Anterior
                </a>
              )}
              {pagina < totalPages && (
                <a href={`/dashboard/carrinhos?pagina=${pagina + 1}${statusFiltro ? `&status=${statusFiltro}` : ""}`}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Seguinte →
                </a>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 text-xs text-slate-400">
          O sistema envia automaticamente um email de recuperação 1 hora após o abandono (cron horário).
          Após 24h sem conversão o carrinho é marcado como expirado.
        </p>
      </div>
    </div>
  );
}
