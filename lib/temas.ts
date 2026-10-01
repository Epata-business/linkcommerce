// Catálogo central de temas — fonte única da verdade.
// Para adicionar um tema: adicionar entrada aqui, criar componentes em components/storefront/temas/<slug>/
// Não é preciso migrações — o campo `tema` na Loja é uma string livre.

export type Nicho =
  | "geral"
  | "moda"
  | "moda-autor"
  | "joalharia"
  | "alta-joalharia"
  | "mobiliario"
  | "decoracao"
  | "restaurante"
  | "beleza"
  | "cosmetica"
  | "electronica"
  | "servicos"
  | "fitness";

export type TipoPlano = "gratuito" | "pro";

export interface Tema {
  slug: string;
  nome: string;
  nicho: Nicho;
  nichoLabel: string;
  descricao: string;
  plano: TipoPlano;
  previewDesktop: string; // URL da imagem de preview
  previewMobile: string;
  cor: string;            // cor de destaque do card
  caracteristicas: string[];
}

export const TEMAS: Tema[] = [
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
    nichoLabel: "Moda",
    descricao: "Hero editorial com campanha visual, lookbook, coleções por temporada e destaque para variantes de tamanho.",
    plano: "gratuito",
    previewDesktop: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop&q=80",
    previewMobile: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=375&h=667&fit=crop&q=80",
    cor: "#1a1a1a",
    caracteristicas: ["Hero editorial", "Coleções", "Tamanhos e variantes", "Lookbook", "Edições limitadas"],
  },
  {
    slug: "atelier",
    nome: "Atelier",
    nicho: "moda-autor",
    nichoLabel: "Moda de Autor",
    descricao: "Para marcas de autor, alfaiataria e noivas. Campanha imersiva, peças em edição numerada, reserva de prova privada.",
    plano: "pro",
    previewDesktop: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=500&fit=crop&q=80",
    previewMobile: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=375&h=667&fit=crop&q=80",
    cor: "#2C1810",
    caracteristicas: ["Campanha imersiva", "Edições numeradas", "Feito à medida", "Reserva de prova", "Preço personalizado"],
  },
  {
    slug: "joalharia",
    nome: "Jóia",
    nicho: "joalharia",
    nichoLabel: "Joalharia",
    descricao: "Fundo escuro premium com fotografia de produto em destaque, apresentação de materiais e certificados.",
    plano: "pro",
    previewDesktop: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=500&fit=crop&q=80",
    previewMobile: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=375&h=667&fit=crop&q=80",
    cor: "#C5A253",
    caracteristicas: ["Fundo escuro luxury", "Configurador (metal/pedra/tamanho)", "Certificado de origem", "Pedido ao concierge", "Entrega com seguro"],
  },
  {
    slug: "luxo",
    nome: "Luxo",
    nicho: "alta-joalharia",
    nichoLabel: "Alta Joalharia",
    descricao: "Experiência de atendimento personalizado para alta joalharia e relojoaria. Configurador completo com preço em tempo real.",
    plano: "pro",
    previewDesktop: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=500&fit=crop&q=80",
    previewMobile: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=375&h=667&fit=crop&q=80",
    cor: "#8B7355",
    caracteristicas: ["Configurador premium", "Preço em tempo real", "Pré-visualização 3D", "Visita domiciliar", "Entrega segurada"],
  },
  {
    slug: "casa",
    nome: "Casa",
    nicho: "mobiliario",
    nichoLabel: "Mobiliário & Decoração",
    descricao: "Imagens de ambiente, produtos clicáveis em contexto, configurador de tecidos, pedido de orçamento e serviço de projecto.",
    plano: "pro",
    previewDesktop: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=500&fit=crop&q=80",
    previewMobile: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=375&h=667&fit=crop&q=80",
    cor: "#5C4A3A",
    caracteristicas: ["Imagens de ambiente", "Configurador de materiais", "Medidas e opções", "Pedido de orçamento", "Serviço de projecto"],
  },
  {
    slug: "gourmet",
    nome: "Gourmet",
    nicho: "restaurante",
    nichoLabel: "Restaurante & Alimentação",
    descricao: "Menu visual por categoria, destaque para pratos do dia, reservas online e pedidos para take-away.",
    plano: "pro",
    previewDesktop: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop&q=80",
    previewMobile: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=375&h=667&fit=crop&q=80",
    cor: "#8B2500",
    caracteristicas: ["Menu visual", "Destaque diário", "Reservas online", "Take-away", "Secção de alérgenos"],
  },
  {
    slug: "beleza",
    nome: "Beleza",
    nicho: "beleza",
    nichoLabel: "Beleza & Cosmética",
    descricao: "Layout editorial suave, destaque para ingredientes, rotinas e kits. Perfeito para marcas de cosmética e cuidado pessoal.",
    plano: "pro",
    previewDesktop: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=500&fit=crop&q=80",
    previewMobile: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=375&h=667&fit=crop&q=80",
    cor: "#C4748A",
    caracteristicas: ["Editorial suave", "Kits e rotinas", "Ingredientes em destaque", "Avaliações", "Recomendação de tipo de pele"],
  },
];

export function getTema(slug: string): Tema {
  return TEMAS.find(t => t.slug === slug) ?? TEMAS[0];
}

export const TEMAS_GRATUITOS = TEMAS.filter(t => t.plano === "gratuito");
export const TEMAS_PRO = TEMAS.filter(t => t.plano === "pro");
