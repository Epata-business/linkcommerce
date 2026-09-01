"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { valor: "52 mil", unidade: "Milhões Kz", label: "transacionados na Multicaixa em Q1 2026", icon: "💳" },
  { valor: "+98%", unidade: "crescimento", label: "do e-commerce angolano em 2026 vs 2025", icon: "📈" },
  { valor: "49.3%", unidade: "do valor total", label: "da Multicaixa já são pagamentos digitais", icon: "📱" },
  { valor: "8.7M", unidade: "operações", label: "no KWiK só no primeiro semestre de 2026", icon: "⚡" },
];

const FLOW = [
  { icon: "📸", label: "Instagram" },
  { icon: "💬", label: "WhatsApp" },
  { icon: "🛍️", label: "LinkCommerce" },
  { icon: "💳", label: "Pagamento" },
  { icon: "📦", label: "Pedido" },
  { icon: "🚗", label: "Entrega" },
  { icon: "🔁", label: "Recompra" },
];

export function AngolaSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeFlow, setActiveFlow] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setActiveFlow((p) => (p + 1) % FLOW.length);
    }, 800);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-28 px-6"
      style={{ background: "linear-gradient(180deg, #080A12 0%, #05082a 50%, #080A12 100%)" }}>

      {/* Fundo decorativo Angola */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #cc0000 0%, #000000 70%)" }} />
        {/* Grade de pontos */}
        {[...Array(8)].map((_, i) => (
          [...Array(12)].map((_, j) => (
            <div key={`${i}-${j}`}
              className="absolute w-px h-px rounded-full"
              style={{
                background: "rgba(131,129,251,0.3)",
                top: `${(i / 7) * 100}%`,
                left: `${(j / 11) * 100}%`,
                opacity: Math.random() * 0.5 + 0.1,
              }} />
          ))
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* Badge Angola */}
        <div className={`flex justify-center mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-bold"
            style={{ background: "rgba(204,0,0,0.12)", border: "1px solid rgba(204,0,0,0.3)", color: "#ff6b6b" }}>
            <span className="text-lg">🇦🇴</span>
            Construído para Angola
          </div>
        </div>

        {/* Headline principal */}
        <div className={`text-center mb-6 transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-4">
            <span className="text-white">Somos o </span>
            <span style={{
              background: "linear-gradient(135deg, #153DEC, #8381FB, #cc0000)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Shopify angolano.
            </span>
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto leading-relaxed">
            A infraestrutura que permite a qualquer pequeno negócio angolano
            transformar a sua audiência em vendas reais e organizadas.
          </p>
        </div>

        {/* Flow animado WhatsApp → Entrega */}
        <div className={`flex items-center justify-center gap-0 mb-20 flex-wrap transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          {FLOW.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className={`flex flex-col items-center gap-1.5 px-3 transition-all duration-300 ${activeFlow === i ? "scale-110" : "scale-95 opacity-50"}`}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-300"
                  style={{
                    background: activeFlow === i
                      ? "linear-gradient(135deg, #153DEC, #8381FB)"
                      : "rgba(255,255,255,0.04)",
                    border: activeFlow === i
                      ? "1px solid rgba(131,129,251,0.6)"
                      : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: activeFlow === i ? "0 0 20px rgba(21,61,236,0.4)" : "none",
                  }}>
                  {step.icon}
                </div>
                <span className="text-[10px] font-semibold text-white/50">{step.label}</span>
              </div>
              {i < FLOW.length - 1 && (
                <div className="w-4 h-px mx-1" style={{ background: "rgba(131,129,251,0.2)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Stats do mercado angolano */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16 transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          {STATS.map((s, i) => (
            <div key={i} className="rounded-2xl p-5 text-center group hover:scale-105 transition-transform"
              style={{
                background: "rgba(21,61,236,0.06)",
                border: "1px solid rgba(21,61,236,0.15)",
              }}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-2xl font-extrabold text-white">{s.valor}</p>
              <p className="text-xs font-semibold text-[#8381FB] mb-1">{s.unidade}</p>
              <p className="text-[10px] text-white/30 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Três razões */}
        <div className={`grid md:grid-cols-3 gap-5 transition-all duration-700 delay-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          {[
            {
              icon: "💳",
              titulo: "Paga como Angola paga",
              desc: "Multicaixa Express, transferências bancárias, KWiK e cartões. Sem fricção, sem barreiras.",
              cor: "#cc0000",
            },
            {
              icon: "📍",
              titulo: "Entrega onde Angola vive",
              desc: "Define zonas de entrega por bairro — Talatona, Viana, Luanda Centro — com preços personalizados.",
              cor: "#153DEC",
            },
            {
              icon: "📱",
              titulo: "Vende onde Angola está",
              desc: "Botão WhatsApp integrado, link da loja para o Instagram, QR Code para os teus cartões.",
              cor: "#8381FB",
            },
          ].map((r) => (
            <div key={r.titulo} className="rounded-2xl p-6 hover:scale-[1.02] transition-transform"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
                style={{ background: `${r.cor}18`, border: `1px solid ${r.cor}30` }}>
                {r.icon}
              </div>
              <h3 className="font-bold text-white text-base mb-2">{r.titulo}</h3>
              <p className="text-sm text-white/35 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>

        {/* Citação final */}
        <div className={`mt-16 text-center transition-all duration-700 delay-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <blockquote className="text-xl sm:text-2xl font-semibold text-white/60 italic max-w-3xl mx-auto leading-relaxed">
            "Porque com a LinkCommerce o vendedor recebe pedidos automaticamente,
            cobra digitalmente, controla stock, acompanha entregas e vende novamente
            — <span className="text-white not-italic font-bold">sem precisar de organizar tudo manualmente.</span>"
          </blockquote>
        </div>
      </div>
    </section>
  );
}
