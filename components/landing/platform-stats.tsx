import { prisma } from "@/lib/prisma";

export async function PlatformStats({ locale }: { locale: string }) {
  const [lojas, pedidos] = await Promise.all([
    prisma.loja.count(),
    prisma.pedido.count().catch(() => 0),
  ]);

  const stats = [
    {
      num: lojas > 0 ? `${lojas}` : "–",
      label: locale === "en" ? "Active stores" : locale === "fr" ? "Boutiques actives" : "Lojas activas",
      icon: "🛍️",
    },
    {
      num: pedidos > 0 ? `${pedidos}` : "–",
      label: locale === "en" ? "Orders placed" : locale === "fr" ? "Commandes passées" : "Pedidos realizados",
      icon: "📦",
    },
    {
      num: "0%",
      label: locale === "en" ? "Sales commission" : locale === "fr" ? "Commission vente" : "Comissão de venda",
      icon: "🎁",
    },
    {
      num: "2026",
      label: locale === "en" ? "Launch year" : locale === "fr" ? "Lancement" : "Ano de lançamento",
      icon: "🚀",
    },
  ];

  return (
    <div className="relative py-10 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(21,61,236,0.04)" }}>
      <p className="text-center text-[10px] font-bold text-white/20 uppercase tracking-widest mb-6">
        {locale === "en" ? "LinkCommerce · Real-time platform data" : "LinkCommerce · Dados reais da plataforma em tempo real"}
      </p>
      <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <span className="text-2xl">{s.icon}</span>
            <p className="text-3xl font-extrabold text-gradient mt-1">{s.num}</p>
            <p className="text-xs text-white/35 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
