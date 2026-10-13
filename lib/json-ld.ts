/**
 * Serializa um objecto JSON-LD de forma segura para injecção em <script type="application/ld+json">.
 * JSON.stringify não escapa `</` por defeito, o que permite quebrar o contexto do script tag.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
