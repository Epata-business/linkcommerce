"use client";

import { useEffect, useRef, useState } from "react";

const FASES = [
  { num: "01", titulo: "Cada negócio tem a sua loja", desc: "Catálogo digital, link próprio, QR Code e pagamentos — tudo num só lugar." },
  { num: "02", titulo: "Todos os negócios descobertos", desc: "Marketplace onde consumidores encontram qualquer loja da LinkCommerce em Angola." },
  { num: "03", titulo: "Consumidor pesquisa produtos", desc: "Motor de busca de produtos angolanos — moda, beleza, alimentação, serviços." },
  { num: "04", titulo: "Infraestrutura de comércio digital", desc: "O sistema operativo do pequeno comércio digital angolano." },
];

const PRODUTO = [
  { icon: "🛍️", label: "Loja digital", sub: "Catálogo, fotos, preços, link próprio" },
  { icon: "💬", label: "WhatsApp", sub: "Botão de compra, confirmação automática" },
  { icon: "💳", label: "Pagamentos", sub: "Multicaixa, transferências, KWiK" },
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
    <section ref={ref} className="relative py-28 px-6 overflow-hidden"
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
        <div className={`text-center mb-16 transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
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
        <div className={`grid md:grid-cols-2 gap-5 mb-20 transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="rounded-2xl p-7" style={{ background: "rgba(21,61,236,0.06)", border: "1px solid rgba(21,61,236,0.15)" }}>
            <p className="text-xs font-bold text-[#8381FB] uppercase tracking-widest mb-3">Missão</p>
            <p className="text-white font-semibold text-lg leading-relaxed">
              "Transformar as vendas dispersas pelo WhatsApp e Instagram numa operação digital organizada — loja, pagamentos, pedidos e entregas."
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
        <div className={`mb-20 transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
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
        <div className={`mb-20 transition-all duration-700 delay-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
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

        {/* Métricas de viabilidade */}
        <div className={`transition-all duration-700 delay-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(21,61,236,0.05)", border: "1px solid rgba(21,61,236,0.12)" }}>
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-6">Avaliação independente de viabilidade</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Necessidade do mercado", stars: 5 },
                { label: "Momento do mercado", stars: 5 },
                { label: "Crescimento dos pagamentos", stars: 5 },
                { label: "Potencial de escala", stars: 5 },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex justify-center gap-0.5 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-3.5 h-3.5" fill={i < m.stars ? "#153DEC" : "rgba(255,255,255,0.1)"} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/40 leading-snug">{m.label}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-8">
              <div>
                <p className="text-4xl font-extrabold" style={{ color: "#153DEC" }}>8<span className="text-xl text-white/30">/10</span></p>
                <p className="text-xs text-white/40 mt-1">Viabilidade de mercado</p>
              </div>
              <div className="w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div>
                <p className="text-4xl font-extrabold text-white">3</p>
                <p className="text-xs text-white/40 mt-1">Nichos iniciais<br/><span className="text-[10px]">Moda · Alimentação · Retalho</span></p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
