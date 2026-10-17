import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Não existe plano gratuito: as lojas novas fazem 7 dias de experiência no primeiro plano (menor "ordem").
  const planos = [
    {
      nome: "Starter",
      slug: "starter",
      precoMensal: 5,
      comissaoPercentual: 2,
      limiteProdutos: 50,
      ordem: 1,
    },
    {
      nome: "Basic",
      slug: "basic",
      precoMensal: 15,
      comissaoPercentual: 1.5,
      limiteProdutos: 200,
      permiteDominioProprio: true,
      ordem: 2,
    },
    {
      nome: "Growth",
      slug: "growth",
      precoMensal: 29,
      comissaoPercentual: 1,
      limiteProdutos: null,
      permiteDominioProprio: true,
      permiteApiAccess: true,
      ordem: 3,
    },
    {
      nome: "Pro",
      slug: "pro",
      precoMensal: 59,
      comissaoPercentual: 0,
      limiteProdutos: null,
      permiteDominioProprio: true,
      permiteApiAccess: true,
      permiteWhiteLabel: true,
      ordem: 4,
    },
  ];

  for (const plano of planos) {
    await prisma.plano.upsert({
      where: { slug: plano.slug },
      update: plano,
      create: plano,
    });
  }

  console.log(`Seed concluído: ${planos.length} planos criados/actualizados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
