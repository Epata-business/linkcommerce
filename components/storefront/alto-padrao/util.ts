// Utilitários partilhados pelos temas Alto Padrão (servidor e cliente).

export interface VarianteAP {
  id: string;
  nomeOpcao: string;
  precoExtra: number;
  stock: number;
}

export interface ProdutoAP {
  id: string;
  titulo: string;
  descricao: string | null;
  preco: number;
  imagemUrl: string | null;
  stock: number;
  variantes: VarianteAP[];
  novo?: boolean;
}

export interface LojaAP {
  nome: string;
  moeda: string;
  telefoneWA: string | null; // só dígitos
  descricao: string | null;  // seoDescricao
  logotipoUrl: string | null;
}

export function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function preencher(texto: string, valores: Record<string, string | number>) {
  return texto.replace(/\{(\w+)\}/g, (m, k) => (k in valores ? String(valores[k]) : m));
}

export function temImagem(url: string | null | undefined): url is string {
  return !!url && /^https?:\/\//i.test(url);
}

// "Ouro amarelo 18k" → cor de "ouro amarelo"; procura a chave mais longa contida no nome.
export function corDaAmostra(valor: string, amostras: Record<string, string>): string | null {
  const v = normalizar(valor);
  const chaves = Object.keys(amostras).sort((a, b) => b.length - a.length);
  const chave = chaves.find((k) => v.includes(k));
  return chave ? amostras[chave] : null;
}

// Clareia (t > 0) ou escurece (t < 0) uma cor #rrggbb.
export function ajustarCor(hex: string, t: number) {
  const n = parseInt(hex.slice(1, 7), 16);
  const canal = (c: number) => (t > 0 ? Math.round(c + (255 - c) * t) : Math.round(c * (1 + t)));
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => canal(c).toString(16).padStart(2, "0")).join("");
}

export function partesDaVariante(nomeOpcao: string) {
  return nomeOpcao.split("/").map((p) => p.trim()).filter(Boolean);
}

// Link de contacto: WhatsApp da loja quando existe, senão a página de contacto.
export function linkContacto(telefoneWA: string | null, mensagem: string, subdominio: string) {
  if (telefoneWA) return `https://wa.me/${telefoneWA}?text=${encodeURIComponent(mensagem)}`;
  return `/loja/${subdominio}/contacto`;
}
