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
  | "servicos"
  // Coleção Alto Padrão
  | "moda-autor"
  | "alta-joalharia"
  | "mobiliario";

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

// ── ALTO PADRÃO ──────────────────────────────────────────────────────────────
// Coleção do vídeo "linkcommerce-alto-padrao": Maison Ndala (gratuito), Áurea e Casa Mussulo (Pro).
// Ficam fora de TEMAS para não mexer na landing nem no resumo do dashboard (que contam
// "8 temas · 4 gratuitos, 4 Pro"); a galeria de temas, a API e a loja usam TODOS_OS_TEMAS.
// Design, textos e configurador de cada um: lib/temas-alto-padrao.ts.
export const TEMAS_ALTO_PADRAO: Tema[] = [
  {
    slug: "maison-ndala",
    nome: "Maison Ndala",
    nicho: "moda-autor",
    nichoLabel: "Moda de Autor",
    descricao: "Para ateliers, alfaiataria e peças em edição limitada. Página de campanha com imagem grande, peças numeradas e reserva de prova privada no atelier.",
    plano: "gratuito",
    previewDesktop: "/temas/maison-ndala-desktop.jpg",
    previewMobile: "/temas/maison-ndala-mobile.jpg",
    cor: "#2433A0",
    caracteristicas: ["Página de campanha", "Peças em edição limitada", "Cor e tamanho por peça", "Prova privada no atelier", "Perfeito no telemóvel"],
  },
  {
    slug: "aurea",
    nome: "Áurea",
    nicho: "alta-joalharia",
    nichoLabel: "Alta Joalharia",
    descricao: "Para joalharias que vendem com acompanhamento personalizado. Configurador ao vivo de metal, pedra e gravação, com o preço a mudar a cada escolha.",
    plano: "pro",
    previewDesktop: "/temas/aurea-desktop.jpg",
    previewMobile: "/temas/aurea-mobile.jpg",
    cor: "#C9A45C",
    caracteristicas: ["Configurador ao vivo", "Preço muda a cada escolha", "Reserva com concierge", "Gravação personalizada", "Perfeito no telemóvel"],
  },
  {
    slug: "casa-mussulo",
    nome: "Casa Mussulo",
    nicho: "mobiliario",
    nichoLabel: "Mobiliário",
    descricao: "Para lojas de design e estúdios de interiores. Produtos clicáveis dentro do ambiente, tecido e tamanho que mudam o preço e serviço de projeto de interiores.",
    plano: "pro",
    previewDesktop: "/temas/casa-mussulo-desktop.jpg",
    previewMobile: "/temas/casa-mussulo-mobile.jpg",
    cor: "#1F6F78",
    caracteristicas: ["Produtos clicáveis no ambiente", "Tecido e tamanho mudam o preço", "Projeto de interiores", "Marcação de visita", "Perfeito no telemóvel"],
  },
];

export const TODOS_OS_TEMAS: Tema[] = [...TEMAS, ...TEMAS_ALTO_PADRAO];

export function getTema(slug: string): Tema {
  return TODOS_OS_TEMAS.find(t => t.slug === slug) ?? TEMAS[0];
}

export const TEMAS_GRATUITOS = TEMAS.filter(t => t.plano === "gratuito");
export const TEMAS_PRO = TEMAS.filter(t => t.plano === "pro");
