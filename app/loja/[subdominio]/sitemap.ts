import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap({
  params,
}: {
  params: { subdominio: string };
}): Promise<MetadataRoute.Sitemap> {
  const base = `https://${params.subdominio}.linkcommerce.app`;

  const produtos = await prisma.produto.findMany({
    where: { loja: { subdominio: params.subdominio }, ativo: true },
    select: { id: true, updatedAt: true },
  });

  const produtoUrls: MetadataRoute.Sitemap = produtos.map((p) => ({
    url: `${base}/produto/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/contacto`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/devolucoes`, changeFrequency: "monthly", priority: 0.3 },
    ...produtoUrls,
  ];
}
