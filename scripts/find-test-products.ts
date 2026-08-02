import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Los productos de prueba son los que NO tienen SKU que empiece con YP-
  const testProducts = await prisma.product.findMany({
    where: {
      NOT: { sku: { startsWith: 'YP-' } }
    },
    select: { id: true, sku: true, name: true, brand: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  })
  
  console.log(`=== PRODUCTOS DE PRUEBA (no-Yupoo): ${testProducts.length} ===\n`)
  for (const p of testProducts) {
    console.log(`  ${p.sku}: ${p.name.substring(0, 50)} [${p.brand?.name}]`)
  }
  
  // Also check Yupoo products with test-like names
  const yupooTestProducts = await prisma.product.findMany({
    where: {
      sku: { startsWith: 'YP-' },
      OR: [
        { name: { contains: 'test', mode: 'insensitive' } },
        { name: { contains: 'prueba', mode: 'insensitive' } },
        { name: { contains: 'demo', mode: 'insensitive' } },
      ]
    },
    select: { id: true, sku: true, name: true },
    take: 20,
  })
  
  if (yupooTestProducts.length > 0) {
    console.log(`\n=== PRODUCTOS YUPOO CON NOMBRE 'test/prueba': ${yupooTestProducts.length} ===`)
    for (const p of yupooTestProducts) {
      console.log(`  ${p.sku}: ${p.name.substring(0, 50)}`)
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
