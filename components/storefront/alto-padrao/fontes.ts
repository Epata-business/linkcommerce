// Tipografia dos temas Alto Padrão (ver lib/temas-alto-padrao.ts).
// O shell aplica a fonte de corpo com className e expõe a de títulos em --ap-titulo,
// usada nos componentes com a classe [font-family:var(--ap-titulo)].
import { Bodoni_Moda, Jost, Cormorant_Garamond, Karla, Unbounded, Figtree } from "next/font/google";
import type { SlugAltoPadrao } from "@/lib/temas-alto-padrao";

// O next/font não tem métricas de substituição para a Bodoni Moda: usa-se a Didot/Bodoni do sistema.
const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], display: "swap", adjustFontFallback: false, fallback: ["Didot", "Bodoni 72", "serif"] });
const jost = Jost({ subsets: ["latin"], display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], display: "swap" });
const karla = Karla({ subsets: ["latin"], display: "swap" });
const unbounded = Unbounded({ subsets: ["latin"], display: "swap" });
const figtree = Figtree({ subsets: ["latin"], display: "swap" });

export const FONTES: Record<SlugAltoPadrao, { titulo: string; classeCorpo: string }> = {
  "maison-ndala": { titulo: bodoni.style.fontFamily, classeCorpo: jost.className },
  aurea: { titulo: cormorant.style.fontFamily, classeCorpo: karla.className },
  "casa-mussulo": { titulo: unbounded.style.fontFamily, classeCorpo: figtree.className },
};
