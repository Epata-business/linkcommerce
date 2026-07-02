import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const planos = [
    { nome: "Free", slug: "free", precoMensal: 0, comissaoPercentual: 3, limiteProdutos: 10, ordem: 0 },
    {
      nome: "Starter",
      slug: "starter",
      precoMensal: 19,
      comissaoPercentual: 2,
      limiteProdutos: 100,
      permiteDominioProprio: true,
      ordem: 1,
    },
    {
      nome: "Growth",
      slug: "growth",
      precoMensal: 49,
      comissaoPercentual: 1,
      limiteProdutos: null,
      permiteDominioProprio: true,
      permiteApiAccess: true,
      ordem: 2,
    },
    {
      nome: "Enterprise",
      slug: "enterprise",
      precoMensal: 199,
      comissaoPercentual: 0,
      limiteProdutos: null,
      permiteDominioProprio: true,
      permiteApiAccess: true,
      permiteWhiteLabel: true,
      ordem: 3,
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
