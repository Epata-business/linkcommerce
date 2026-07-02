"use client";

import { useEffect, useRef, useState } from "react";

const ORDERS = [
  { id: "#4831", valor: "+89€",  pais: "🇵🇹", produto: "Camisola Premium" },
  { id: "#4832", valor: "+124€", pais: "🇦🇴", produto: "Calças Slim" },
  { id: "#4833", valor: "+45€",  pais: "🇧🇷", produto: "Acessório Gold" },
  { id: "#4834", valor: "+210€", pais: "🇫🇷", produto: "Pack Exclusivo" },
  { id: "#4835", valor: "+67€",  pais: "🇪🇸", produto: "Edição Limitada" },
];

export function LiveDashboard() {
  const [orders, setOrders]   = useState(ORDERS.slice(0, 2));
  const [revenue, setRevenue] = useState(4821);
  const [visits,  setVisits]  = useState(1243);
  const [tilt,    setTilt]    = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const idx = useRef(2);

  // Add a new order every 2.8s
  useEffect(() => {
    const t = setInterval(() => {
      const next = ORDERS[idx.current % ORDERS.length];
      idx.current++;
      setOrders((prev) => [next, ...prev].slice(0, 4));
      setRevenue((r) => r + Math.floor(Math.random() * 120 + 30));
      setVisits((v)  => v + Math.floor(Math.random() * 8  + 1));
    }, 2800);
    return () => clearInterval(t);
  }, []);

  // Mouse parallax tilt
  useEffect(() => {
    const el = ref.current?.closest("[data-hero]") as HTMLElement | null;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const rx = ((e.clientY - cy) / rect.height) * 10;
      const ry = ((e.clientX - cx) / rect.width)  * -10;
      setTilt({ x: rx, y: ry });
    };
    el.addEventListener("mousemove", handler);
    return () => el.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div
      ref={ref}
      className="relative w-full max-w-2xl mx-auto select-none"
      style={{
        perspective: "1200px",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Glow behind */}
      <div className="absolute inset-0 rounded-3xl blur-3xl opacity-30"
        style={{ background: "radial-gradient(ellipse at 50% 60%, #153DEC 0%, #8381FB 50%, transparent 80%)" }} />

      <div
        className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(2,5,61,0.95) 0%, rgba(8,10,18,0.98) 100%)",
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 0.1s ease-out",
        }}
      >
        {/* Top bar */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5" style={{ background: "rgba(21,61,236,0.08)" }}>
          <span className="h-3 w-3 rounded-full bg-red-500/70" />
          <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <span className="h-3 w-3 rounded-full bg-green-500/70" />
          <span className="ml-3 text-xs text-white/30 font-montserrat">linkcommerce.app/dashboard</span>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Ao vivo
          </span>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="hidden sm:flex flex-col w-44 border-r border-white/5 p-3 gap-1" style={{ background: "rgba(2,5,61,0.6)" }}>
            {["Início","Produtos","Pedidos","Clientes","Marketing"].map((item, i) => (
              <div key={item} className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${i === 0 ? "text-white" : "text-white/30 hover:text-white/60"}`}
                style={i === 0 ? { background: "linear-gradient(90deg,#153DEC,#8381FB)", boxShadow: "0 0 12px rgba(21,61,236,0.4)" } : {}}>
                {item}
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="flex-1 p-4 space-y-3">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Receita", value: `${revenue.toLocaleString("pt-PT")}€`, delta: "+12%" },
                { label: "Visitas", value: visits.toLocaleString("pt-PT"), delta: "+8%" },
                { label: "Pedidos", value: orders.length + 28 + "", delta: "+5%" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-2.5 glass">
                  <p className="text-[10px] text-white/40 mb-1">{s.label}</p>
                  <p className="text-sm font-bold text-white tabular-nums">{s.value}</p>
                  <p className="text-[10px] text-green-400 mt-0.5">{s.delta}</p>
                </div>
              ))}
            </div>

            {/* Live orders feed */}
            <div className="rounded-xl glass overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Pedidos recentes</p>
                <span className="flex items-center gap-1 text-[10px] text-[#8381FB]">
                  <span className="h-1 w-1 rounded-full bg-[#8381FB] animate-pulse" />
                  Em tempo real
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {orders.map((o, i) => (
                  <div key={o.id + i}
                    className="flex items-center gap-2 px-3 py-2 text-xs transition-all"
                    style={{ animation: i === 0 ? "slideIn 0.35s ease forwards" : "none" }}>
                    <span className="text-base">{o.pais}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 font-medium truncate">{o.produto}</p>
                      <p className="text-white/30 text-[10px]">{o.id}</p>
                    </div>
                    <span className="text-green-400 font-bold shrink-0">{o.valor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini bar chart */}
            <div className="rounded-xl glass px-3 py-2.5">
              <p className="text-[10px] text-white/40 mb-2">Vendas — últimos 7 dias</p>
              <div className="flex items-end gap-1 h-10">
                {[40,65,45,80,55,90,100].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm transition-all duration-700"
                    style={{
                      height: `${h}%`,
                      background: i === 6
                        ? "linear-gradient(180deg,#153DEC,#8381FB)"
                        : "rgba(131,129,251,0.25)",
                    }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
