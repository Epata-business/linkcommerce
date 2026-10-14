// Ilustrações vectoriais dos temas Alto Padrão — as mesmas do vídeo. Servem de imagem
// quando o produto não tem fotografia e mudam de cor com a escolha no configurador.
// Sem hooks: podem ser usadas em componentes de servidor e de cliente.
import { ajustarCor } from "./util";

// ── Áurea: anel com pedra ─────────────────────────────────────────────────────
export function Anel({ metal = "#D4AF61", pedra = "#E6F2F7", uid, className }: { metal?: string; pedra?: string; uid: string; className?: string }) {
  return (
    <svg viewBox="0 0 200 230" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`brilho-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`metal-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={ajustarCor(metal, 0.45)} />
          <stop offset="50%" stopColor={metal} />
          <stop offset="100%" stopColor={ajustarCor(metal, -0.35)} />
        </linearGradient>
        <linearGradient id={`pedra-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ajustarCor(pedra, 0.5)} />
          <stop offset="100%" stopColor={pedra} />
        </linearGradient>
      </defs>
      <circle cx="100" cy="62" r="64" fill={`url(#brilho-${uid})`} />
      <circle cx="100" cy="150" r="64" fill="none" stroke={`url(#metal-${uid})`} strokeWidth="15" />
      <circle cx="100" cy="150" r="56" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="2" />
      <path d="M84 90 L116 90 L110 80 L90 80 Z" fill={`url(#metal-${uid})`} />
      <path d="M100 28 L126 46 L117 78 L83 78 L74 46 Z" fill={`url(#pedra-${uid})`} />
      <path d="M74 46 L126 46 M100 28 L90 46 L100 78 L110 46 Z M83 78 L90 46 M117 78 L110 46" fill="none" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="1.2" />
    </svg>
  );
}

// ── Casa Mussulo: sofá (a largura acompanha o nº de lugares) ──────────────────
export function Sofa({ tecido = "#CFC3AA", lugares = 3, className }: { tecido?: string; lugares?: number; className?: string }) {
  const n = Math.min(Math.max(lugares, 1), 5);
  const largura = 90 + n * 70;
  const x0 = (400 - largura) / 2;
  const almofada = (largura - 60) / n;
  const escuro = ajustarCor(tecido, -0.14);
  const claro = ajustarCor(tecido, 0.12);
  return (
    <svg viewBox="0 0 400 180" className={className} aria-hidden="true">
      <ellipse cx="200" cy="168" rx={largura / 2 + 10} ry="7" fill="#000" opacity="0.08" />
      <rect x={x0 + 18} y="150" width="8" height="16" rx="2" fill="#5B3A26" />
      <rect x={x0 + largura - 26} y="150" width="8" height="16" rx="2" fill="#5B3A26" />
      <rect x={x0} y="92" width={largura} height="60" rx="14" fill={escuro} />
      {Array.from({ length: n }).map((_, i) => (
        <rect key={`c${i}`} x={x0 + 30 + i * almofada + 3} y="44" width={almofada - 6} height="56" rx="12" fill={tecido} />
      ))}
      {Array.from({ length: n }).map((_, i) => (
        <rect key={`a${i}`} x={x0 + 30 + i * almofada + 3} y="98" width={almofada - 6} height="26" rx="9" fill={claro} />
      ))}
      <rect x={x0 - 4} y="70" width="38" height="82" rx="16" fill={tecido} />
      <rect x={x0 + largura - 34} y="70" width="38" height="82" rx="16" fill={tecido} />
    </svg>
  );
}

// ── Maison Ndala: peças da coleção (vestido, kaftan, casaco, mala) ────────────
export type FormaPeca = "casaco" | "vestido" | "kaftan" | "mala";
export const FORMAS_PECA: FormaPeca[] = ["vestido", "kaftan", "casaco", "mala"];

export function Peca({ cor = "#2433A0", forma = "casaco", className }: { cor?: string; forma?: FormaPeca; className?: string }) {
  const linha = ajustarCor(cor, 0.3);
  return (
    <svg viewBox="0 0 200 260" className={className} aria-hidden="true">
      {forma === "vestido" && (
        <>
          <path d="M78 18 L86 18 L92 64 L108 64 L114 18 L122 18 L124 72 L132 104 L172 246 L28 246 L68 104 L76 72 Z" fill={cor} />
          <path d="M70 104 L130 104" stroke={linha} strokeWidth="2" strokeOpacity="0.8" />
        </>
      )}
      {forma === "kaftan" && (
        <>
          <path d="M62 28 L138 28 L192 72 L172 112 L150 94 L150 246 L50 246 L50 94 L28 112 L8 72 Z" fill={cor} />
          <path d="M86 28 L100 56 L114 28" fill="none" stroke={linha} strokeWidth="2" strokeOpacity="0.8" />
        </>
      )}
      {forma === "casaco" && (
        <>
          <path d="M70 20 L100 34 L130 20 L168 40 L188 150 L164 156 L152 92 L150 246 L50 246 L48 92 L36 156 L12 150 L32 40 Z" fill={cor} />
          <path d="M70 20 L100 120 L130 20 M100 120 L100 246 M52 150 L80 150 M120 150 L148 150" fill="none" stroke={linha} strokeWidth="2" strokeOpacity="0.8" />
          <circle cx="104" cy="168" r="3" fill={linha} />
          <circle cx="104" cy="196" r="3" fill={linha} />
        </>
      )}
      {forma === "mala" && (
        <>
          <path d="M66 120 C66 52 134 52 134 120" fill="none" stroke={cor} strokeWidth="10" strokeLinecap="round" />
          <path d="M36 116 L164 116 L178 236 L22 236 Z" fill={cor} />
          <path d="M36 140 L164 140" stroke={linha} strokeWidth="2" strokeOpacity="0.6" />
        </>
      )}
    </svg>
  );
}

// ── Maison Ndala: treliça da página de campanha ───────────────────────────────
export function Trelica({ uid, cor = "#2433A0", className }: { uid: string; cor?: string; className?: string }) {
  return (
    <svg className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 500">
      <defs>
        <pattern id={`trelica-${uid}`} width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0 H44 M0 4 H44 M0 0 V44 M4 0 V44" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1.2" fill="none" />
        </pattern>
      </defs>
      <rect width="400" height="500" fill={cor} />
      <rect width="400" height="500" fill={`url(#trelica-${uid})`} />
    </svg>
  );
}

// ── Casa Mussulo: sala com vista para o mar ───────────────────────────────────
// As posições dos pontos clicáveis estão em ambiente.tsx (em % deste viewBox 1200×560).
export function Sala({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 560" className={className} aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id="sala-ceu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CFE3E8" />
          <stop offset="100%" stopColor="#EDF3F1" />
        </linearGradient>
        <linearGradient id="sala-mar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5AA3A8" />
          <stop offset="100%" stopColor="#1F6F78" />
        </linearGradient>
      </defs>
      {/* Janela */}
      <rect x="560" y="40" width="500" height="360" rx="6" fill="#26302C" />
      <rect x="574" y="54" width="472" height="332" fill="url(#sala-ceu)" />
      <rect x="574" y="222" width="472" height="164" fill="url(#sala-mar)" />
      <rect x="806" y="54" width="10" height="332" fill="#26302C" />
      {/* Palmeira */}
      <path d="M960 230 C962 180 966 140 972 110" stroke="#2F4A3B" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M972 110 C940 92 912 96 896 118 M972 110 C1000 88 1030 92 1044 114 M972 110 C952 80 932 76 918 84 M972 110 C994 78 1016 76 1030 86" stroke="#2F4A3B" strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* Candeeiro de pé */}
      <ellipse cx="250" cy="548" rx="46" ry="8" fill="#26302C" />
      <path d="M250 548 L250 200 C250 168 270 150 300 150 L372 150" stroke="#26302C" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M346 150 L410 150 L398 188 L358 188 Z" fill="#C58A3A" />
      {/* Sofá */}
      <rect x="420" y="430" width="440" height="100" rx="20" fill="#BFB196" />
      <rect x="452" y="392" width="122" height="70" rx="14" fill="#CFC3AA" />
      <rect x="580" y="392" width="122" height="70" rx="14" fill="#CFC3AA" />
      <rect x="708" y="392" width="122" height="70" rx="14" fill="#CFC3AA" />
      <rect x="404" y="420" width="50" height="110" rx="20" fill="#CFC3AA" />
      <rect x="826" y="420" width="50" height="110" rx="20" fill="#CFC3AA" />
      <rect x="440" y="528" width="10" height="20" fill="#5B3A26" />
      <rect x="830" y="528" width="10" height="20" fill="#5B3A26" />
      {/* Mesa de apoio */}
      <ellipse cx="930" cy="478" rx="54" ry="12" fill="#8A5A3A" />
      <rect x="925" y="478" width="10" height="68" fill="#6E4630" />
      <ellipse cx="930" cy="548" rx="30" ry="6" fill="#6E4630" />
      {/* Planta */}
      <path d="M1086 470 C1070 400 1050 360 1030 330 M1090 470 C1094 400 1104 350 1122 310 M1094 470 C1110 420 1136 390 1160 376 M1082 470 C1060 430 1036 412 1010 404" stroke="#3F5E4A" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M1060 470 L1120 470 L1112 548 L1068 548 Z" fill="#D9CBB0" />
    </svg>
  );
}
