import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  })
  
  console.log('=== DISTRIBUCIÓN FINAL DE CATEGORÍAS ===\n')
  for (const c of categories) {
    if (c._count.products > 0) {
      console.log(`${c.icon} ${c.name}: ${c._count.products} productos`)
    }
  }
  
  // Show 5 samples per category
  console.log('\n=== MUESTRAS POR CATEGORÍA ===')
  for (const c of categories) {
    if (c._count.products === 0) continue
    const samples = await prisma.product.findMany({
      where: { categoryId: c.id },
      select: { name: true, brand: { select: { name: true } } },
      take: 5,
    })
    console.log(`\n${c.icon} ${c.name} (${c._count.products}):`)
    for (const s of samples) {
      console.log(`  [${s.brand?.name}] ${s.name.substring(0, 55)}`)
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
