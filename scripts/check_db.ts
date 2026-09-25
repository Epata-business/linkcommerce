import { prisma } from '../lib/prisma'

async function main() {
  const lojaId = 'cmueql0km0002c5sazoigpore'
  const planoId = 'cmr16503k0001cmx3j0ejx7hp' // Starter €5
  const proximaCobranca = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  // stripeCustomerId único — usar id único baseado na loja
  const sub = await prisma.subscricao.upsert({
    where: { lojaId },
    update: { planoId, status: 'ATIVA', proximaCobranca },
    create: { lojaId, planoId, status: 'ATIVA', proximaCobranca, stripeCustomerId: `manual_${lojaId}`, stripeSubscriptionId: `manual_${lojaId}` },
  })
  await prisma.loja.update({ where: { id: lojaId }, data: { planoId } })
  console.log('✅ Subscrição boutiquejojo activada:', sub.status)
  
  const sub2 = await prisma.subscricao.findUnique({ where: { lojaId: 'cmu6qr02c00029rxx7jgymp94' } })
  console.log('✅ Subscrição contato.epata:', sub2?.status ?? 'NÃO ENCONTRADA')
}
main().catch(console.error).finally(() => prisma.$disconnect())
