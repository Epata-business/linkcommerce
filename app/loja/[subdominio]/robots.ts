import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function robots({
  params,
}: {
  params: { subdominio: string };
}): Promise<MetadataRoute.Robots> {
  const loja = await prisma.loja.findUnique({
    where: { subdominio: params.subdominio },
    select: { publicada: true },
  });

  const base = `https://${params.subdominio}.linkcommerce.cc`;

  if (!loja || !loja.publicada) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
