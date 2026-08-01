import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const bv = await prisma.product.findMany({
    where: { name: { contains: 'Bottegass' } },
    select: { name: true, brand: { select: { name: true } } },
    take: 1,
  })
  if (bv[0]) {
    const combined = `${bv[0].name} ${bv[0].brand?.name}`.toLowerCase()
    console.log('Name:', bv[0].name)
    console.log('Brand:', bv[0].brand?.name)
    console.log('Combined:', combined)
    console.log('Has "bag":', combined.includes('bag'))
    console.log('Has "belt":', combined.includes('belt'))
    console.log('Has "bols":', combined.includes('bols'))
  }
}
main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
