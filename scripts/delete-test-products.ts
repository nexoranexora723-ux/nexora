import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Delete all products that DON'T have YP- prefix in SKU
  const deleted = await prisma.product.deleteMany({
    where: {
      NOT: { sku: { startsWith: 'YP-' } }
    }
  })
  
  console.log(`=== PRODUCTOS DE PRUEBA ELIMINADOS: ${deleted.count} ===\n`)
  
  // Verify
  const total = await prisma.product.count()
  const yupoo = await prisma.product.count({ where: { sku: { startsWith: 'YP-' } } })
  const nonYupoo = await prisma.product.count({ where: { NOT: { sku: { startsWith: 'YP-' } } } })
  
  console.log(`Total productos restantes: ${total}`)
  console.log(`Productos Yupoo (YP-): ${yupoo}`)
  console.log(`Productos no-Yupoo: ${nonYupoo}`)
  
  // Show final distribution
  console.log('\n=== DISTRIBUCIÓN FINAL ===')
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  })
  for (const c of categories) {
    if (c._count.products > 0) {
      console.log(`  ${c.icon} ${c.name}: ${c._count.products} productos`)
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
