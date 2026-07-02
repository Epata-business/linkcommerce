import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminPage() {
  const [totalLojas, totalUtilizadores, totalPedidos, totalReceita, lojasMaisRecentes] = await Promise.all([
    prisma.loja.count(),
    prisma.user.count(),
    prisma.pedido.count(),
    prisma.pedido.aggregate({ _sum: { total: true } }),
    prisma.loja.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        utilizadores: { select: { name: true, email: true }, take: 1 },
        _count: { select: { pedidos: true, produtos: true } },
      },
    }),
  ]);

  const receita = Number(totalReceita._sum.total ?? 0);

  const stats = [
    { label: "Lojas criadas", value: totalLojas, icon: "🏪", cor: "bg-indigo-50 text-indigo-700" },
    { label: "Utilizadores", value: totalUtilizadores, icon: "👤", cor: "bg-blue-50 text-blue-700" },
    { label: "Pedidos totais", value: totalPedidos, icon: "📦", cor: "bg-emerald-50 text-emerald-700" },
    {
      label: "Receita total",
      value: receita.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " (multi-moeda)",
      icon: "💰",
      cor: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Visão Geral da Plataforma</h1>
        <p className="text-sm text-slate-500">Dados em tempo real de todas as lojas LinkCommerce</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white border border-slate-100 p-5">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl mb-3 ${s.cor}`}>
              {s.icon}
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Lojas recentes */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Lojas mais recentes</h2>
          <Link href="/admin/lojas" className="text-xs font-semibold text-indigo-600 hover:underline">Ver todas →</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500">Loja</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500">Dono</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500">Nicho</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500">Produtos</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500">Pedidos</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500">Criada</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500">Acesso</th>
            </tr>
          </thead>
          <tbody>
            {lojasMaisRecentes.map((loja) => (
              <tr key={loja.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: loja.corPrimaria }}>
                      {loja.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{loja.nome}</p>
                      <p className="text-xs text-slate-400">{loja.subdominio}.linkcommerce.app</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {loja.utilizadores[0]?.name ?? loja.utilizadores[0]?.email ?? "—"}
                </td>
                <td className="px-5 py-3">
                  {loja.tipoNegocio ? (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">{loja.tipoNegocio}</span>
                  ) : "—"}
                </td>
                <td className="px-5 py-3 text-slate-600">{loja._count.produtos}</td>
                <td className="px-5 py-3 text-slate-600">{loja._count.pedidos}</td>
                <td className="px-5 py-3 text-slate-400 text-xs">{new Date(loja.createdAt).toLocaleDateString("pt-PT")}</td>
                <td className="px-5 py-3">
                  <a href={`/api/admin/impersonate?lojaId=${loja.id}`} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors">
                    Aceder →
                  </a>
                </td>
              </tr>
            ))}
            {lojasMaisRecentes.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Nenhuma loja ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
