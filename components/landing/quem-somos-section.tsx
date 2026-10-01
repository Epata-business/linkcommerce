"use client";

import { useEffect, useRef, useState } from "react";

export function QuemSomosSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative py-24 px-6 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #080A12 0%, #060818 100%)", borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="relative z-10 max-w-5xl mx-auto">

        {/* Badge */}
        <div className={`flex justify-center mb-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <span className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold"
            style={{ background: "rgba(21,61,236,0.1)", border: "1px solid rgba(21,61,236,0.25)", color: "#8381FB" }}>
            Quem Somos
          </span>
        </div>

        {/* Headline */}
        <div className={`text-center mb-14 transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
            A infraestrutura que transforma<br />
            <span style={{ background: "linear-gradient(135deg,#153DEC,#8381FB)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              audiência em vendas
            </span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto leading-relaxed">
            Nascemos para automatizar o que milhares de negócios angolanos ainda fazem manualmente — do WhatsApp à entrega.
          </p>
        </div>

        {/* Missão + Visão */}
        <div className={`grid md:grid-cols-2 gap-5 transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="rounded-2xl p-8"
            style={{ background: "rgba(21,61,236,0.06)", border: "1px solid rgba(21,61,236,0.15)" }}>
            <p className="text-xs font-bold text-[#8381FB] uppercase tracking-widest mb-4">Missão</p>
            <p className="text-white font-semibold text-lg leading-relaxed">
              "Dar a cada pequeno negócio angolano as ferramentas que antes só as grandes marcas tinham — loja digital, pagamentos, gestão e entregas, num só lugar."
            </p>
          </div>
          <div className="rounded-2xl p-8"
            style={{ background: "rgba(131,129,251,0.06)", border: "1px solid rgba(131,129,251,0.15)" }}>
            <p className="text-xs font-bold text-[#8381FB] uppercase tracking-widest mb-4">Visão</p>
            <p className="text-white font-semibold text-lg leading-relaxed">
              "Ser a infraestrutura de comércio digital dos pequenos negócios angolanos — do catálogo à entrega, num só lugar."
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
