import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  try {
    const products = await prisma.product.findMany({
      where: { OR: [
        { name: { contains: 'gucci', mode: 'insensitive' } },
        { sku: { contains: 'YP', mode: 'insensitive' } },
      ]},
      select: { id: true, name: true, sku: true },
      take: 3,
      orderBy: { createdAt: 'desc' },
    })
    console.log('Query OK:', products.length, 'products')
    for (const p of products) console.log(`  ${p.sku}: ${p.name.substring(0, 40)}`)
  } catch (error) {
    console.error('Query error:', error)
  }
}
main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
