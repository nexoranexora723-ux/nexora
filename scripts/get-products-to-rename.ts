import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'
const prisma = new PrismaClient()

async function main() {
  // Get products with model numbers that we can search for
  // Focus on brands with real model numbers: LV (M numbers), Gucci, Chanel, etc.
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { name: { contains: 'M2', mode: 'insensitive' } }, // LV model numbers
        { name: { contains: 'M4', mode: 'insensitive' } }, // LV model numbers
        { name: { contains: 'M5', mode: 'insensitive' } }, // LV model numbers
        { name: { contains: 'M6', mode: 'insensitive' } }, // LV model numbers
        { name: { contains: 'M8', mode: 'insensitive' } }, // LV model numbers
      ]
    },
    select: { id: true, sku: true, name: true, brand: { select: { name: true } } },
    take: 100,
    orderBy: { createdAt: 'asc' },
  })
  
  console.log(`Productos con model numbers (LV): ${products.length}`)
  
  // Group by brand
  const byBrand = new Map<string, typeof products>()
  for (const p of products) {
    const brand = p.brand?.name || 'Varios'
    if (!byBrand.has(brand)) byBrand.set(brand, [])
    byBrand.get(brand)!.push(p)
  }
  
  for (const [brand, items] of byBrand) {
    console.log(`\n${brand}: ${items.length} productos`)
    for (const p of items.slice(0, 5)) {
      console.log(`  ${p.sku}: ${p.name.substring(0, 60)}`)
    }
  }
  
  // Save to file for the search script
  writeFileSync('/tmp/products-to-rename.json', JSON.stringify(products))
  console.log(`\n✓ Guardados ${products.length} productos en /tmp/products-to-rename.json`)
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
