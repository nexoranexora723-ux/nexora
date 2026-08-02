import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  })
  
  console.log('=== DISTRIBUCIÓN ACTUAL ===\n')
  for (const c of categories) {
    if (c._count.products === 0) continue
    console.log(`${c.icon} ${c.name}: ${c._count.products} productos`)
  }
  
  // Sample 5 products per category to find mismatches
  console.log('\n=== MUESTRAS POR CATEGORÍA (para detectar errores) ===\n')
  for (const c of categories) {
    if (c._count.products === 0) continue
    const samples = await prisma.product.findMany({
      where: { categoryId: c.id, status: 'ACTIVE' },
      select: { name: true, brand: { select: { name: true } } },
      take: 8,
      orderBy: { createdAt: 'asc' },
    })
    console.log(`\n${c.icon} ${c.name} (${c._count.products}):`)
    for (const s of samples) {
      console.log(`  [${s.brand?.name}] ${s.name.substring(0, 60)}`)
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
