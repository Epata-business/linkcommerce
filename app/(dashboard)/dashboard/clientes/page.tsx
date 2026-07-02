import { prisma } from "@/lib/prisma";
import { getLojaId } from "@/lib/get-loja-id";
import { formatarPreco } from "@/lib/moeda";
import Link from "next/link";

export default async function ClientesPage() {
  const lojaId = await getLojaId();

  const [loja, clientesRegistados, pedidosUnicos] = await Promise.all([
    prisma.loja.findUnique({ where: { id: lojaId }, select: { moeda: true, corPrimaria: true } }),
    prisma.cliente.findMany({
      where: { lojaId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { pedidos: true } },
        pedidos: { select: { total: true }, where: { status: { not: "CANCELLED" } } },
      },
    }),
    // Clientes únicos via email de pedidos (sem conta)
    prisma.pedido.groupBy({
      by: ["clienteEmail"],
      where: { lojaId },
      _count: true,
      _sum: { total: true },
      orderBy: { _count: { clienteEmail: "desc" } },
    }),
  ]);

  const moeda = loja?.moeda ?? "EUR";
  const cor = loja?.corPrimaria ?? "#153DFC";

  // Merge: clientes registados + clientes anónimos de pedidos
  const emailsRegistados = new Set(clientesRegistados.map(c => c.email));
  const clientesAnonimos = pedidosUnicos.filter(p => !emailsRegistados.has(p.clienteEmail));

  const totalClientesUnicos = emailsRegistados.size + clientesAnonimos.length;
  const totalReceita = pedidosUnicos.reduce((s, p) => s + Number(p._sum.total ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900">Clientes</h1>
          <p className="text-slate-400 text-sm mt-1">{totalClientesUnicos} cliente{totalClientesUnicos !== 1 ? "s" : ""} únicos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: "👥", label: "Clientes únicos", value: totalClientesUnicos.toString() },
            { icon: "💰", label: "Receita total", value: formatarPreco(totalReceita, moeda) },
            { icon: "🔄", label: "Com conta criada", value: clientesRegistados.length.toString() },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {totalClientesUnicos === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
            <div className="text-5xl mb-4">👥</div>
            <p className="font-bold text-slate-700">Ainda sem clientes</p>
            <p className="text-sm text-slate-400 mt-1">Os clientes aparecerão aqui quando fizerem o primeiro pedido.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Clientes com conta */}
            {clientesRegistados.length > 0 && (
              <>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1">Com conta registada</p>
                {clientesRegistados.map((cliente) => {
                  const totalGasto = cliente.pedidos.reduce((s, p) => s + Number(p.total), 0);
                  const iniciais = (cliente.nome ?? cliente.email).slice(0, 2).toUpperCase();
                  return (
                    <div key={cliente.id} className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg,${cor},${cor}bb)` }}>
                        {iniciais}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{cliente.nome ?? "—"}</p>
                        <p className="text-xs text-slate-400 truncate">{cliente.email}</p>
                        {cliente.telefone && <p className="text-xs text-slate-400">{cliente.telefone}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black text-slate-900">{formatarPreco(totalGasto, moeda)}</p>
                        <p className="text-xs text-slate-400">{cliente._count.pedidos} pedido{cliente._count.pedidos !== 1 ? "s" : ""}</p>
                        <p className="text-[10px] text-slate-300 mt-1">
                          desde {new Date(cliente.createdAt).toLocaleDateString("pt-PT", { month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Clientes anónimos (só via pedidos) */}
            {clientesAnonimos.length > 0 && (
              <>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1 mt-4">Compraram como convidados</p>
                {clientesAnonimos.map((c) => (
                  <Link key={c.clienteEmail} href={`/dashboard/pedidos?email=${encodeURIComponent(c.clienteEmail)}`}
                    className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-slate-400 bg-slate-100 flex-shrink-0">
                      {c.clienteEmail.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{c.clienteEmail}</p>
                      <p className="text-xs text-slate-400">Comprador convidado</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-slate-900">{formatarPreco(Number(c._sum.total ?? 0), moeda)}</p>
                      <p className="text-xs text-slate-400">{c._count} pedido{c._count !== 1 ? "s" : ""}</p>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
