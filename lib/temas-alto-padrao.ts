// Coleção "Alto Padrão" — design dos três temas apresentados no vídeo linkcommerce-alto-padrao:
//   01 Maison Ndala  · Moda de autor          · gratuito
//   02 Áurea         · Alta joalharia         · Pro
//   03 Casa Mussulo  · Mobiliário e interiores · Pro
//
// O catálogo (nome, plano, preview) vive em lib/temas.ts → TEMAS_ALTO_PADRAO.
// Aqui fica o que cada tema precisa para ser desenhado: paleta, textos, eixos de variantes,
// cores das amostras e blocos próprios (prova privada, concierge, projeto de interiores).
// Os componentes estão em components/storefront/alto-padrao/.
//
// Variantes → configurador: o nome da variante é lido em partes separadas por " / ".
//   Maison Ndala  "Cobalto / 38 / Feito à medida"   → Cor / Tamanho / Acabamento
//   Áurea         "Ouro amarelo / Diamante / 13"    → Metal / Pedra / Medida
//   Casa Mussulo  "Veludo lagoa / 3 lugares"        → Tecido / Lugares
// Cada combinação é uma Variante com o seu precoExtra. É assim que "o preço muda a cada escolha"
// sem tocar no checkout, que recalcula sempre preço + precoExtra a partir da BD.
//
// Textos: {loja} = nome da loja, {ano} = ano corrente, {n} = nº de peças, {horario} = horário escolhido.
// O subtítulo do hero usa o seoDescricao da loja quando existe; o texto daqui é o padrão.

export type SlugAltoPadrao = "maison-ndala" | "aurea" | "casa-mussulo";

export const SLUGS_ALTO_PADRAO: SlugAltoPadrao[] = ["maison-ndala", "aurea", "casa-mussulo"];

export function isTemaAltoPadrao(slug: string | null | undefined): slug is SlugAltoPadrao {
  return !!slug && (SLUGS_ALTO_PADRAO as string[]).includes(slug);
}

export interface PaletaAltoPadrao {
  fundo: string;        // fundo da página
  superficie: string;   // painéis e cartões
  texto: string;
  textoSuave: string;
  destaque: string;     // itálicos, selecção, preços
  linha: string;        // divisórias e contornos
  escuro: string;       // blocos escuros (prova privada, concierge, serviço)
  textoEscuro: string;  // texto sobre os blocos escuros
  botao: string;        // botão principal e carrinho
  textoBotao: string;
  paineis: string[];    // fundos alternados dos cartões de produto
}

export interface ConfigAltoPadrao {
  slug: SlugAltoPadrao;
  numero: string;       // "01 / 03" — ordem na coleção
  segmento: string;     // "Moda de autor"
  publico: string;      // a quem se destina (texto do vídeo)
  cores: PaletaAltoPadrao;
  textos: {
    anuncio?: string;                  // faixa no topo (Maison Ndala)
    subMarca?: string;                 // linha por baixo do logótipo (Áurea)
    eyebrow: string;
    titulo: [string, string, string];  // antes · palavra em destaque · depois
    subtitulo: string;
    ctaPrincipal: string;
    ctaSecundario: string;
    colecaoEyebrow: string;
    colecaoTitulo: string;
    verTodas: string;
    vazio: string;
    adicionar: string;                 // "Adicionar ao saco" / "Adicionar ao projeto"
    verPeca: string;
  };
  eixos: string[];                     // rótulos das partes do nome da variante
  amostras: Record<string, string>;    // nome da opção (sem acentos, minúsculas) → cor
  marcacao?: {
    eyebrow: string;
    titulo: string;
    texto: string;
    botao: string;
    mensagem: string;
    confirmacao: string;
    horas: string[];
    dias: number;
  };
  concierge?: { botao: string; mensagem: string };
  gravacao?: { rotulo: string; placeholder: string; nota: string };
  destaques?: { titulo: string; texto: string }[];
  servico?: {
    eyebrow: string;
    titulo: string;
    passos: { titulo: string; texto: string }[];
    nota: string;
    botao: string;
    mensagem: string;
  };
}

export const CONFIG_ALTO_PADRAO: Record<SlugAltoPadrao, ConfigAltoPadrao> = {
  // ── 01 · MAISON NDALA ─────────────────────────────────────────────────────────
  // Fundo marfim, tinta preta e azul-cobalto. Serifa Didone (Bodoni Moda) com itálico
  // em cobalto; texto corrido em Jost leve; botões rectos em maiúsculas espaçadas.
  "maison-ndala": {
    slug: "maison-ndala",
    numero: "01 / 03",
    segmento: "Moda de autor",
    publico: "Para ateliers, alfaiataria e peças em edição limitada.",
    cores: {
      fundo: "#F8F6F1",
      superficie: "#ECE8E0",
      texto: "#141414",
      textoSuave: "#6B6760",
      destaque: "#2433A0",
      linha: "#E2DED5",
      escuro: "#111111",
      textoEscuro: "#F8F6F1",
      botao: "#141414",
      textoBotao: "#F8F6F1",
      paineis: ["#ECE8E0", "#2433A0", "#DDD7CD", "#1A1A1A"],
    },
    textos: {
      anuncio: "Provas privadas no atelier · Peças em edição limitada",
      eyebrow: "Coleção {ano}",
      titulo: ["Vestir a sua", "própria", "história."],
      subtitulo: "Peças de autor cortadas e cosidas à mão, em edições limitadas. Cada uma sai do atelier com o nome de quem a fez.",
      ctaPrincipal: "Ver coleção",
      ctaSecundario: "Marcar prova privada",
      colecaoEyebrow: "Peças de autor",
      colecaoTitulo: "A coleção",
      verTodas: "Ver as {n} peças",
      vazio: "A nova coleção chega em breve.",
      adicionar: "Adicionar ao saco",
      verPeca: "Ver peça",
    },
    // "Feito à medida (+15%)" do vídeo = 3.ª parte da variante, com precoExtra de 15%
    eixos: ["Cor", "Tamanho", "Acabamento"],
    amostras: {
      preto: "#151515", branco: "#F4F1EA", marfim: "#EFE9DC", cru: "#EAE4D6", osso: "#E7E0D2",
      areia: "#D8CFC0", bege: "#D9CCB4", cobalto: "#2433A0", azul: "#2433A0", marinho: "#1B2550",
      terra: "#7A3B22", castanho: "#6B4226", camel: "#B08350", vermelho: "#9E2A2B", bordeaux: "#5E1A24",
      verde: "#2F5D50", oliva: "#6B6B3A", dourado: "#C9A35C", ouro: "#C9A35C", cinza: "#8A8A8A",
    },
    marcacao: {
      eyebrow: "Atendimento privado",
      titulo: "Uma hora no atelier, só para si.",
      texto: "Reserve um horário e preparamos as peças no seu tamanho antes de chegar.",
      botao: "Reservar prova privada",
      mensagem: "Olá! Gostaria de reservar uma prova privada no atelier para {horario}.",
      confirmacao: "Abrimos o WhatsApp para confirmar a prova de {horario}.",
      horas: ["11:00", "16:00"],
      dias: 3,
    },
  },

  // ── 02 · ÁUREA ────────────────────────────────────────────────────────────────
  // Verde-esmeralda profundo com luz radial ao centro, ouro e marfim. Cormorant Garamond
  // nos títulos (itálico a ouro) e Karla espaçada na navegação e nos rótulos.
  aurea: {
    slug: "aurea",
    numero: "02 / 03",
    segmento: "Alta joalharia",
    publico: "Para joalharias que vendem com acompanhamento personalizado.",
    cores: {
      fundo: "#0F2A22",
      superficie: "#143A2F",
      texto: "#F1E9D8",
      textoSuave: "#9DB3A8",
      destaque: "#D4B26A",
      linha: "#D4B26A33",
      escuro: "#0B1F19",
      textoEscuro: "#F1E9D8",
      botao: "#C9A45C",
      textoBotao: "#0F2A22",
      paineis: ["#143A2F", "#173F33", "#12352B", "#163C31"],
    },
    textos: {
      subMarca: "Alta joalharia",
      eyebrow: "Alta joalharia · {loja}",
      titulo: ["Feito para durar", "mais", "do que nós."],
      subtitulo: "Ouro, pedras escolhidas uma a uma e um joalheiro dedicado a cada peça.",
      ctaPrincipal: "Criar o meu anel",
      ctaSecundario: "Ver coleções",
      colecaoEyebrow: "Coleções",
      colecaoTitulo: "Para cada promessa",
      verTodas: "{n} peças",
      vazio: "As novas peças chegam em breve.",
      adicionar: "Adicionar ao saco",
      verPeca: "Ver peça",
    },
    eixos: ["Metal", "Pedra", "Medida"],
    amostras: {
      "ouro amarelo": "#D4AF61", amarelo: "#D4AF61", "ouro branco": "#DADDE0", branco: "#DADDE0",
      "ouro rose": "#D99C8A", rose: "#D99C8A", rosa: "#D99C8A", platina: "#C9CDD2", prata: "#C0C4C8",
      ouro: "#D4AF61", diamante: "#E6F2F7", esmeralda: "#2E9E6B", safira: "#2F55B5", rubi: "#B3263E",
      perola: "#F1EDE4", ametista: "#8E5BB5", topazio: "#E2A54B", morganite: "#E8B4A6",
    },
    concierge: {
      botao: "Reservar com concierge",
      mensagem: "Olá! Gostaria de reservar com concierge:",
    },
    gravacao: {
      rotulo: "Gravação interior",
      placeholder: "Ex.: A & P · 04.10.2026",
      nota: "A gravação é combinada com o concierge.",
    },
    destaques: [
      { titulo: "Configurador ao vivo", texto: "Metal, pedra e medida escolhidos por si, com o preço sempre à vista." },
      { titulo: "Atendimento de concierge", texto: "Um joalheiro acompanha a peça do primeiro esboço à entrega." },
      { titulo: "Entrega em mão", texto: "Combinamos consigo o dia e o local para entregar a peça." },
    ],
    marcacao: {
      eyebrow: "Concierge",
      titulo: "Um joalheiro dedicado a cada peça.",
      texto: "Escolha um horário e acompanhamos a sua escolha do início ao fim.",
      botao: "Reservar com concierge",
      mensagem: "Olá! Gostaria de marcar um atendimento com concierge para {horario}.",
      confirmacao: "Abrimos o WhatsApp para confirmar o atendimento de {horario}.",
      horas: ["10:00", "15:00", "17:00"],
      dias: 2,
    },
  },

  // ── 03 · CASA MUSSULO ─────────────────────────────────────────────────────────
  // Cinza-pérola, carvão e azul-petróleo, com ocre nos detalhes. Títulos em Unbounded
  // muito pesado; texto em Figtree; botões em pílula.
  "casa-mussulo": {
    slug: "casa-mussulo",
    numero: "03 / 03",
    segmento: "Mobiliário e interiores",
    publico: "Para lojas de design e estúdios de interiores.",
    cores: {
      fundo: "#F2F2EF",
      superficie: "#E6E6E1",
      texto: "#1D2522",
      textoSuave: "#66706B",
      destaque: "#1F6F78",
      linha: "#D9D9D3",
      escuro: "#1D2522",
      textoEscuro: "#F2F2EF",
      botao: "#1D2522",
      textoBotao: "#F2F2EF",
      paineis: ["#E6E6E1", "#E3E1DA", "#E6E6E1", "#E1E3DF"],
    },
    textos: {
      eyebrow: "",
      titulo: ["Casas que respiram", "como", "o Mussulo."],
      subtitulo: "Mobiliário de autor desenhado para o clima e a luz de Angola.",
      ctaPrincipal: "Ver as peças",
      ctaSecundario: "Marcar visita",
      colecaoEyebrow: "Peças",
      colecaoTitulo: "Para cada divisão",
      verTodas: "{n} peças",
      vazio: "As novas peças chegam em breve.",
      adicionar: "Adicionar ao projeto",
      verPeca: "Ver peça",
    },
    eixos: ["Tecido", "Lugares"],
    amostras: {
      "veludo lagoa": "#1F6F78", lagoa: "#1F6F78", petroleo: "#1F5F66", "linho cru": "#E8E1D3", linho: "#E8E1D3",
      "boucle osso": "#EDE7DA", osso: "#EDE7DA", areia: "#D6C7A8", "couro conhaque": "#8A4B2A", conhaque: "#8A4B2A",
      terracota: "#A0522D", carvao: "#3A3F3D", grafite: "#3A3F3D", cinza: "#9A9A94", verde: "#4A6B55",
      mostarda: "#C58A3A", ocre: "#C58A3A", branco: "#F4F3EF", preto: "#1E1E1E",
    },
    servico: {
      eyebrow: "Serviço de interiores",
      titulo: "Da planta à casa pronta, connosco.",
      passos: [
        { titulo: "Visita e medições", texto: "Um designer visita o espaço e ouve como vive a casa." },
        { titulo: "Proposta em 3D", texto: "Recebe o projeto com peças, tecidos e orçamento fechado." },
        { titulo: "Entrega e montagem", texto: "Tratamos de tudo e entregamos a casa pronta a usar." },
      ],
      nota: "Fale connosco para conhecer as condições do projeto de interiores.",
      botao: "Marcar visita",
      mensagem: "Olá! Gostaria de marcar uma visita para um projeto de interiores.",
    },
  },
};

export function getConfigAltoPadrao(slug: SlugAltoPadrao): ConfigAltoPadrao {
  return CONFIG_ALTO_PADRAO[slug];
}
