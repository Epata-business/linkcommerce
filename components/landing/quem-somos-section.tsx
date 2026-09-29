"use client";

import { useEffect, useRef, useState } from "react";

const FASES = [
  { num: "01", titulo: "Cada negócio tem a sua loja", desc: "Catálogo digital, link próprio, QR Code e pagamentos — tudo num só lugar." },
  { num: "02", titulo: "Todas as lojas num só marketplace", desc: "Marketplace onde consumidores encontram qualquer loja da LinkCommerce em Angola." },
  { num: "03", titulo: "Consumidor pesquisa produtos", desc: "Motor de busca de produtos angolanos — moda, beleza, alimentação, serviços." },
  { num: "04", titulo: "Infraestrutura de comércio digital", desc: "O sistema operativo do pequeno comércio digital angolano." },
];

const PRODUTO = [
  { icon: "🛍️", label: "Loja digital", sub: "Catálogo, fotos, preços, link próprio" },
  { icon: "💬", label: "WhatsApp", sub: "Botão de compra, confirmação automática" },
  { icon: "💳", label: "Pagamentos", sub: "Transferências bancárias, Multicaixa (em breve)" },
  { icon: "📦", label: "Pedidos", sub: "Novo → Pago → Enviado → Entregue" },
  { icon: "👥", label: "Clientes", sub: "Histórico, contactos, frequência" },
  { icon: "🚗", label: "Entrega", sub: "Zonas, cálculo, acompanhamento" },
  { icon: "📊", label: "Analytics", sub: "Vendas, produto mais vendido, ticket médio" },
];

export function QuemSomosSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative py-14 px-6 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #080A12 0%, #060818 100%)" }}>

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* Badge */}
        <div className={`flex justify-center mb-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold"
            style={{ background: "rgba(21,61,236,0.1)", border: "1px solid rgba(21,61,236,0.25)", color: "#8381FB" }}>
            Quem Somos
          </div>
        </div>

        {/* Headline */}
        <div className={`text-center mb-10 transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
            A infraestrutura que transforma<br />
            <span style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              audiência em vendas
            </span>
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto leading-relaxed">
            A LinkCommerce nasceu para resolver o problema central do comércio digital angolano:
            milhares de negócios vendem pelo WhatsApp e Instagram, mas a operação continua manual.
          </p>
        </div>

        {/* Missão + Visão */}
        <div className={`grid md:grid-cols-2 gap-5 mb-12 transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="rounded-2xl p-7" style={{ background: "rgba(21,61,236,0.06)", border: "1px solid rgba(21,61,236,0.15)" }}>
            <p className="text-xs font-bold text-[#8381FB] uppercase tracking-widest mb-3">Missão</p>
            <p className="text-white font-semibold text-lg leading-relaxed">
              "Dar a cada pequeno negócio angolano as ferramentas que antes só as grandes marcas tinham — loja digital, pagamentos, gestão de pedidos e entregas, num só lugar."
            </p>
          </div>
          <div className="rounded-2xl p-7" style={{ background: "rgba(131,129,251,0.06)", border: "1px solid rgba(131,129,251,0.15)" }}>
            <p className="text-xs font-bold text-[#8381FB] uppercase tracking-widest mb-3">Visão</p>
            <p className="text-white font-semibold text-lg leading-relaxed">
              "Ser a infraestrutura de comércio digital dos pequenos negócios angolanos — do catálogo à entrega, num só lugar."
            </p>
          </div>
        </div>

        {/* Produto LinkCommerce 1.0 */}
        <div className={`mb-12 transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <p className="text-center text-xs font-bold text-white/30 uppercase tracking-widest mb-8">LinkCommerce 1.0 — O produto completo</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {PRODUTO.map((p) => (
              <div key={p.label} className="rounded-2xl p-4 text-center"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-2xl mb-2">{p.icon}</div>
                <p className="text-xs font-bold text-white mb-1">{p.label}</p>
                <p className="text-[10px] text-white/30 leading-snug">{p.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap */}
        <div className={`mb-12 transition-all duration-700 delay-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <p className="text-center text-xs font-bold text-white/30 uppercase tracking-widest mb-8">Fases de evolução</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FASES.map((f, i) => (
              <div key={f.num} className="relative rounded-2xl p-5"
                style={{ background: i === 0 ? "rgba(21,61,236,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${i === 0 ? "rgba(21,61,236,0.3)" : "rgba(255,255,255,0.06)"}` }}>
                <p className="text-3xl font-extrabold mb-3" style={{ color: i === 0 ? "#153DEC" : "rgba(255,255,255,0.1)" }}>{f.num}</p>
                <p className="text-sm font-bold text-white mb-2">{f.titulo}</p>
                <p className="text-xs text-white/35 leading-relaxed">{f.desc}</p>
                {i === 0 && (
                  <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(21,61,236,0.2)", color: "#8381FB" }}>Agora</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Nichos iniciais */}
        <div className={`transition-all duration-700 delay-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(21,61,236,0.05)", border: "1px solid rgba(21,61,236,0.12)" }}>
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-6">Nichos iniciais</p>
            <div className="flex justify-center gap-8">
              {["Moda", "Alimentação", "Retalho"].map((nicho) => (
                <div key={nicho}>
                  <p className="text-base font-extrabold text-white">{nicho}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
