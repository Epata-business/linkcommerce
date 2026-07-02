import { prisma } from "@/lib/prisma";
import { BackButton } from "@/components/ui/back-button";

const roleLabel: Record<string, { label: string; cor: string }> = {
  ADMIN_PLATAFORMA: { label: "Admin", cor: "bg-red-100 text-red-700" },
  LOJISTA:         { label: "Lojista", cor: "bg-indigo-100 text-indigo-700" },
  OPERADOR_POS:    { label: "POS", cor: "bg-amber-100 text-amber-700" },
};

export default async function AdminUtilizadoresPage() {
  const utilizadores = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { loja: { select: { nome: true, subdominio: true } } },
  });

  return (
    <div className="p-6">
      <BackButton href="/admin" label="← Painel admin" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Utilizadores</h1>
        <p className="text-sm text-slate-500">{utilizadores.length} conta{utilizadores.length !== 1 ? "s" : ""} registada{utilizadores.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500">Utilizador</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500">Role</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500">Loja</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500">Registado em</th>
            </tr>
          </thead>
          <tbody>
            {utilizadores.map((u) => {
              const r = roleLabel[u.role] ?? { label: u.role, cor: "bg-slate-100 text-slate-700" };
              return (
                <tr key={u.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                        {(u.name ?? u.email ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{u.name ?? "—"}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.cor}`}>{r.label}</span>
                  </td>
                  <td className="px-5 py-3">
                    {u.loja ? (
                      <div>
                        <p className="text-slate-700">{u.loja.nome}</p>
                        <p className="text-xs text-slate-400">{u.loja.subdominio}.linkcommerce.app</p>
                      </div>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString("pt-PT")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
