'use client';
import { useEffect, useRef, useState } from 'react';

/* Simplified 3D rotating globe with store dots + connection lines */
const STORES = [
  { name: "Lisboa", lat: 38.7, lon: -9.1,  flag: "🇵🇹", revenue: "€12.4k", active: true },
  { name: "Luanda", lat: -8.8, lon: 13.2,  flag: "🇦🇴", revenue: "Kz 890k", active: true },
  { name: "São Paulo", lat: -23.5, lon: -46.6, flag: "🇧🇷", revenue: "€8.2k", active: true },
  { name: "Paris", lat: 48.8, lon: 2.3,    flag: "🇫🇷", revenue: "€31.1k", active: true },
  { name: "Madrid", lat: 40.4, lon: -3.7,  flag: "🇪🇸", revenue: "€19.7k", active: false },
  { name: "Londres", lat: 51.5, lon: -0.1, flag: "🇬🇧", revenue: "€24.3k", active: true },
  { name: "Dubai", lat: 25.2, lon: 55.3,   flag: "🇦🇪", revenue: "€15.9k", active: false },
  { name: "Nova York", lat: 40.7, lon: -74.0, flag: "🇺🇸", revenue: "$28.5k", active: true },
];

function latLonToXY(lat: number, lon: number, cx: number, cy: number, r: number, rotY: number) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + rotY) * Math.PI / 180;
  const x3 = r * Math.sin(phi) * Math.cos(theta);
  const y3 = r * Math.cos(phi);
  const z3 = r * Math.sin(phi) * Math.sin(theta);
  return { x: cx + x3, y: cy - y3, z: z3, visible: z3 > -r * 0.1 };
}

export default function GlobalNetwork({ locale = 'pt' }: { locale?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const rotRef = useRef(0);
  const [hovered, setHovered] = useState<typeof STORES[0] | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastX = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let frame = 0;

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.38;
      ctx.clearRect(0, 0, W, H);

      if (!isDragging.current) rotRef.current += 0.12;

      // Globe base
      const grad = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r);
      grad.addColorStop(0, 'rgba(21,61,236,0.18)');
      grad.addColorStop(0.6, 'rgba(2,5,61,0.25)');
      grad.addColorStop(1, 'rgba(8,10,18,0.08)');
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.fillStyle = grad; ctx.fill();
      ctx.strokeStyle = 'rgba(21,61,236,0.15)'; ctx.lineWidth = 1;
      ctx.stroke();

      // Latitude lines
      for (let lat = -60; lat <= 60; lat += 30) {
        const phi = (90 - lat) * Math.PI / 180;
        const yr = r * Math.cos(phi);
        const xr = r * Math.sin(phi);
        ctx.beginPath(); ctx.ellipse(cx, cy - r*Math.cos(phi), xr, Math.abs(yr)*0.18, 0, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(131,129,251,0.08)'; ctx.lineWidth = 0.5; ctx.stroke();
      }
      // Longitude lines
      for (let lon = 0; lon < 360; lon += 30) {
        const theta = (lon + rotRef.current) * Math.PI / 180;
        const startX = cx + r * Math.sin(theta) * 0.15;
        ctx.beginPath(); ctx.ellipse(cx + r*Math.cos(theta)*0.02, cy, r*Math.abs(Math.sin(theta)), r, 0, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(21,61,236,${0.04 + 0.04*Math.abs(Math.cos(theta))})`;
        ctx.lineWidth = 0.5; ctx.stroke();
      }

      // Compute store positions
      const positions = STORES.map(s => ({
        ...s,
        ...latLonToXY(s.lat, s.lon, cx, cy, r, rotRef.current),
      }));

      // Connection lines between active visible stores
      const visible = positions.filter(p => p.visible && p.active);
      for (let i = 0; i < visible.length; i++) {
        for (let j = i+1; j < visible.length; j++) {
          const a = visible[i], b = visible[j];
          const pulse = (Math.sin(frame * 0.04 + i + j) + 1) / 2;
          const linGrad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          linGrad.addColorStop(0, `rgba(21,61,236,${0.08 + 0.12 * pulse})`);
          linGrad.addColorStop(0.5, `rgba(131,129,251,${0.15 + 0.2 * pulse})`);
          linGrad.addColorStop(1, `rgba(21,61,236,${0.08 + 0.12 * pulse})`);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = linGrad; ctx.lineWidth = 0.8; ctx.stroke();

          // Animated packet dot
          const t = (frame * 0.008 + (i*j*0.1)) % 1;
          const px = a.x + (b.x - a.x) * t, py = a.y + (b.y - a.y) * t;
          ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI*2);
          ctx.fillStyle = `rgba(131,129,251,${0.6 + 0.4*pulse})`; ctx.fill();
        }
      }

      // Store dots
      positions.sort((a,b) => a.z - b.z).forEach(p => {
        if (!p.visible) return;
        const sz = 3 + (p.z / r) * 2.5;
        const pulse = p.active ? (Math.sin(frame * 0.06 + STORES.findIndex(s=>s.name===p.name)) + 1) / 2 : 0;

        if (p.active) {
          // Ping ring
          const pingSize = sz + 4 + pulse * 8;
          ctx.beginPath(); ctx.arc(p.x, p.y, pingSize, 0, Math.PI*2);
          ctx.strokeStyle = `rgba(21,61,236,${0.3 * (1 - pulse)})`; ctx.lineWidth = 1; ctx.stroke();
        }

        // Dot
        const dotGrad = ctx.createRadialGradient(p.x - sz*0.3, p.y - sz*0.3, 0, p.x, p.y, sz);
        dotGrad.addColorStop(0, p.active ? '#8381FB' : 'rgba(131,129,251,0.4)');
        dotGrad.addColorStop(1, p.active ? '#153DFC' : 'rgba(21,61,236,0.3)');
        ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, Math.PI*2);
        ctx.fillStyle = dotGrad; ctx.fill();
        if (p.active) {
          ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 0.8; ctx.stroke();
        }
      });

      frame++;
      rafRef.current = requestAnimationFrame(draw);
    };

    const resize = () => {
      const parent = canvas.parentElement!;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement!);
    rafRef.current = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    setMousePos({ x: e.clientX, y: e.clientY });
    if (isDragging.current) {
      rotRef.current += (mx - lastX.current) * 0.3;
      lastX.current = mx;
    }
    // Check hover
    const canvas = canvasRef.current!;
    const cx = canvas.width/2, cy = canvas.height/2, r = Math.min(canvas.width,canvas.height)*0.38;
    const found = STORES.find(s => {
      const { x, y, visible } = latLonToXY(s.lat, s.lon, cx, cy, r, rotRef.current);
      if (!visible) return false;
      return Math.hypot(mx-x, my-y) < 14;
    });
    setHovered(found ?? null);
  };

  const title = locale === 'en' ? 'Stores around the world' : locale === 'fr' ? 'Boutiques dans le monde' : locale === 'es' ? 'Tiendas en el mundo' : 'Lojas em todo o mundo';
  const sub = locale === 'en' ? 'Every circle is a real store generating revenue right now.' : locale === 'fr' ? 'Chaque cercle est une boutique réelle générant des revenus en ce moment.' : locale === 'es' ? 'Cada círculo es una tienda real generando ingresos ahora mismo.' : 'Cada ponto é uma loja real a gerar receita agora mesmo.';

  return (
    <section className="py-20 px-6 relative overflow-hidden" style={{ background: 'linear-gradient(180deg,#080A12 0%,#02053D 60%,#080A12 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest text-[#8381FB] uppercase mb-3">Network</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold">{title}</h2>
          <p className="mt-3 text-white/40 max-w-md mx-auto text-sm">{sub}</p>
        </div>
        <div className="relative" style={{ height: 480 }}>
          <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseMove={handleMouseMove}
            onMouseDown={e => { isDragging.current=true; lastX.current=e.clientX-canvasRef.current!.getBoundingClientRect().left; }}
            onMouseUp={() => { isDragging.current=false; }}
            onMouseLeave={() => { isDragging.current=false; setHovered(null); }} />

          {/* Store list overlay */}
          <div className="absolute top-4 right-0 space-y-1.5 hidden md:block">
            {STORES.slice(0,5).map(s => (
              <div key={s.name} className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs transition-all"
                style={{ background: s.active ? 'rgba(21,61,236,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${s.active ? 'rgba(21,61,236,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                <span>{s.flag}</span>
                <span className="text-white/60 font-medium">{s.name}</span>
                <span className={`font-bold ${s.active ? 'text-green-400' : 'text-white/30'}`}>{s.revenue}</span>
                {s.active && <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />}
              </div>
            ))}
          </div>

          {/* Tooltip */}
          {hovered && (
            <div className="fixed z-50 rounded-xl px-3 py-2 text-xs pointer-events-none"
              style={{ left: mousePos.x + 12, top: mousePos.y - 40, background: 'rgba(8,10,18,0.95)', border: '1px solid rgba(21,61,236,0.4)', backdropFilter: 'blur(8px)' }}>
              <p className="font-bold text-white">{hovered.flag} {hovered.name}</p>
              <p className="text-green-400 font-semibold">{hovered.revenue}</p>
              <p className={`text-[10px] ${hovered.active ? 'text-green-400' : 'text-white/40'}`}>
                {hovered.active ? '● Ativa' : '○ Inativa'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
