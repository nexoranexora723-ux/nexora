import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const bv = await prisma.product.findMany({
    where: { name: { contains: 'Bottegass' } },
    select: { name: true },
    take: 3,
  })
  for (const p of bv) console.log(p.name)
}
main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
