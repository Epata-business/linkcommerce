// Catálogo central de temas — 1 tema por nicho real da plataforma.
// Nichos reais (questionário de onboarding): Geral, Roupa & Moda, Cosméticos & Beleza,
// Alimentação, Calçado, Eletrónica, Artesanato, Serviços.
// Não é preciso migrações — o campo `tema` na Loja é uma string livre.

export type Nicho =
  | "geral"
  | "moda"
  | "beleza"
  | "alimentacao"
  | "calcado"
  | "electronica"
  | "artesanato"
  | "servicos";

export type TipoPlano = "gratuito" | "pro";

export interface Tema {
  slug: string;
  nome: string;
  nicho: Nicho;
  nichoLabel: string;
  descricao: string;
  plano: TipoPlano;
  previewDesktop: string;
  previewMobile: string;
  cor: string;
  caracteristicas: string[];
}

export const TEMAS: Tema[] = [
  // ── GRATUITOS ────────────────────────────────────────────────────────────────
  {
    slug: "essencial",
    nome: "Essencial",
    nicho: "geral",
    nichoLabel: "Geral",
    descricao: "Layout limpo e versátil para qualquer tipo de negócio. Grid de produtos claro, navegação simples.",
    plano: "gratuito",
    previewDesktop: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=500&fit=crop&q=80",
    previewMobile: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=375&h=667&fit=crop&q=80",
    cor: "#153DEC",
    caracteristicas: ["Grid de produtos", "Pesquisa", "Carrinho", "Filtros por categoria"],
  },
  {
    slug: "moda",
    nome: "Moda",
    nicho: "moda",
    nichoLabel: "Roupa & Moda",
    descricao: "Hero editorial com campanha visual, coleções por temporada e destaque para variantes de tamanho.",
    plano: "gratuito",
    previewDesktop: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop&q=80",
    previewMobile: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=375&h=667&fit=crop&q=80",
    cor: "#1a1a1a",
    caracteristicas: ["Hero editorial", "Coleções", "Tamanhos e variantes", "Fundo escuro"],
  },
  {
    slug: "beleza",
    nome: "Beleza",
    nicho: "beleza",
    nichoLabel: "Cosméticos & Beleza",
    descricao: "Layout editorial suave, destaque para ingredientes, rotinas e kits. Para marcas de cosmética e cuidado pessoal.",
    plano: "gratuito",
    previewDesktop: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=500&fit=crop&q=80",
    previewMobile: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=375&h=667&fit=crop&q=80",
    cor: "#C4748A",
    caracteristicas: ["Tom rosa editorial", "Kits e rotinas", "Ingredientes em destaque", "Avaliações"],
  },
  {
    slug: "gourmet",
    nome: "Gourmet",
    nicho: "alimentacao",
    nichoLabel: "Alimentação",
    descricao: "Menu visual por categoria, destaque para pratos do dia e pedidos para take-away. Para restaurantes e negócios de alimentação.",
    plano: "gratuito",
    previewDesktop: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop&q=80",
    previewMobile: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=375&h=667&fit=crop&q=80",
    cor: "#8B2500",
    caracteristicas: ["Menu visual por categoria", "Destaque diário", "Take-away", "Tons quentes"],
  },

  // ── PRO ──────────────────────────────────────────────────────────────────────
  {
    slug: "calcado",
    nome: "Calçado",
    nicho: "calcado",
    nichoLabel: "Calçado",
    descricao: "Grid de produtos com destaque para variantes de tamanho e cor. Perfeito para lojas de calçado e acessórios.",
    plano: "pro",
    previewDesktop: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=500&fit=crop&q=80",
    previewMobile: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=375&h=667&fit=crop&q=80",
    cor: "#1C2B3A",
    caracteristicas: ["Selector de tamanho/cor", "Hero de campanha", "Look completo", "Guia de tamanhos", "Stock por variante"],
  },
  {
    slug: "electronica",
    nome: "Eletrónica",
    nicho: "electronica",
    nichoLabel: "Eletrónica",
    descricao: "Layout técnico com especificações detalhadas, comparação de produtos e destaque para garantia e suporte.",
    plano: "pro",
    previewDesktop: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=500&fit=crop&q=80",
    previewMobile: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=375&h=667&fit=crop&q=80",
    cor: "#0066CC",
    caracteristicas: ["Especificações técnicas", "Comparação de modelos", "Garantia em destaque", "Badges de stock", "Dark tech UI"],
  },
  {
    slug: "artesanato",
    nome: "Artesanato",
    nicho: "artesanato",
    nichoLabel: "Artesanato",
    descricao: "Visual artesanal e orgânico. Destaque para a história por trás de cada peça, materiais e processo criativo.",
    plano: "pro",
    previewDesktop: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&h=500&fit=crop&q=80",
    previewMobile: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=375&h=667&fit=crop&q=80",
    cor: "#7C5C3A",
    caracteristicas: ["História do produto", "Materiais em destaque", "Peças únicas", "Tom artesanal quente", "Encomenda personalizada"],
  },
  {
    slug: "servicos",
    nome: "Serviços",
    nicho: "servicos",
    nichoLabel: "Serviços",
    descricao: "Para prestadores de serviços, consultores e freelancers. Portfólio, pacotes de serviço e contacto directo.",
    plano: "pro",
    previewDesktop: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=500&fit=crop&q=80",
    previewMobile: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=375&h=667&fit=crop&q=80",
    cor: "#2D4A7A",
    caracteristicas: ["Portfólio", "Pacotes de serviço", "Formulário de contacto", "Testemunhos", "Agenda/Marcações"],
  },
];

export function getTema(slug: string): Tema {
  return TEMAS.find(t => t.slug === slug) ?? TEMAS[0];
}

export const TEMAS_GRATUITOS = TEMAS.filter(t => t.plano === "gratuito");
export const TEMAS_PRO = TEMAS.filter(t => t.plano === "pro");
