import { redirect } from "next/navigation";
import Link from "next/link";
import { getClienteSession } from "@/lib/cliente-session";
import { prisma } from "@/lib/prisma";
import { formatarPreco } from "@/lib/moeda";
import { obterSaldoPontos } from "@/lib/fidelidade";
import { SairButton } from "./sair-button";

interface Props { params: { subdominio: string } }

const STATUS_LABEL: Record<string, { label: string; cor: string }> = {
  PENDING:    { label: "Pendente",    cor: "bg-amber-100 text-amber-700" },
  PROCESSING: { label: "Confirmado",  cor: "bg-blue-100 text-blue-700" },
  SHIPPED:    { label: "Enviado",     cor: "bg-purple-100 text-purple-700" },
  DELIVERED:  { label: "Entregue",    cor: "bg-green-100 text-green-700" },
  CANCELLED:  { label: "Cancelado",   cor: "bg-red-100 text-red-700" },
  RETURNED:   { label: "Devolvido",   cor: "bg-orange-100 text-orange-700" },
};

export default async function ContaPage({ params }: Props) {
  const session = await getClienteSession();
  if (!session) redirect(`/loja/${params.subdominio}/conta/entrar`);

  const loja = await prisma.loja.findUnique({
    where: { subdominio: params.subdominio },
    select: { id: true, moeda: true },
  });
  if (!loja) redirect(`/loja/${params.subdominio}`);

  // Guard: session must belong to this loja
  if (session.lojaId !== loja.id) redirect(`/loja/${params.subdominio}/conta/entrar`);

  const [pedidos, saldo] = await Promise.all([
    prisma.pedido.findMany({
      where: { lojaId: loja.id, clienteEmail: session.email },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, createdAt: true, total: true, status: true,
        itens: { select: { quantidade: true, produto: { select: { titulo: true } } }, take: 1 },
      },
    }),
    obterSaldoPontos(loja.id, session.email),
  ]);

  const moeda = loja.moeda ?? "EUR";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Olá, {session.nome?.split(" ")[0] ?? "cliente"} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">{session.email}</p>
        </div>
        <SairButton subdominio={params.subdominio} />
      </div>

      {/* Pontos */}
      {saldo && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Pontos de fidelidade</p>
            <p className="text-3xl font-black text-slate-900">{saldo.pontos.toLocaleString("pt-PT")} pts</p>
            <p className="text-xs text-slate-400 mt-1">
              Vale {formatarPreco(saldo.pontos * saldo.valorPorPonto, moeda)} · Mínimo para resgatar: {saldo.pontosMinResgatar} pts
            </p>
          </div>
          <div className="text-4xl">⭐</div>
        </div>
      )}

      {/* Pedidos */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <h2 className="font-bold text-slate-800">Os meus pedidos</h2>
        </div>

        {pedidos.length === 0 ? (
          <div className="py-14 text-center text-slate-400 text-sm">
            <p className="text-3xl mb-3">🛍️</p>
            <p>Ainda não fizeste nenhum pedido nesta loja.</p>
            <Link
              href={`/loja/${params.subdominio}`}
              className="mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, var(--cor-primaria), var(--cor-primaria)bb)" }}
            >
              Ver produtos →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {pedidos.map((p) => {
              const s = STATUS_LABEL[p.status] ?? { label: p.status, cor: "bg-slate-100 text-slate-600" };
              const primeiroProduto = p.itens[0]?.produto?.titulo ?? "Produto";
              const totalItens = p.itens[0]?.quantidade ?? 1;
              return (
                <Link
                  key={p.id}
                  href={`/loja/${params.subdominio}/pedido/${p.id}/sucesso`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">
                      #{p.id.slice(-8).toUpperCase()} · {primeiroProduto}{p.itens.length > 1 ? ` +${p.itens.length - 1}` : ""}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(p.createdAt).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${s.cor}`}>{s.label}</span>
                    <span className="font-black text-slate-900 text-sm tabular-nums">
                      {formatarPreco(Number(p.total), moeda)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
