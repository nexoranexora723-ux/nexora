import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('=== PRODUCTOS CON NOMBRES SIMILARES ===\n')
  
  const products = await prisma.product.findMany({
    select: { sku: true, name: true, imageUrl: true, brand: { select: { name: true } } },
    take: 5000,
    orderBy: { name: 'asc' },
  })
  
  const groups = new Map<string, typeof products>()
  for (const p of products) {
    const key = p.name.substring(0, 30).toLowerCase()
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(p)
  }
  
  const similarGroups = [...groups.entries()].filter(([_, items]) => items.length > 1).sort((a, b) => b[1].length - a[1].length)
  
  console.log(`Grupos de nombres similares: ${similarGroups.length}`)
  console.log(`\nTop 15 grupos:`)
  for (const [key, items] of similarGroups.slice(0, 15)) {
    console.log(`\n  "${key}..." (${items.length} productos):`)
    for (const p of items.slice(0, 3)) {
      console.log(`    ${p.sku}: ${p.name.substring(0, 55)} | img: ${p.imageUrl?.substring(0, 40)}`)
    }
  }
  
  // Check images
  let sameImg = 0
  let diffImg = 0
  for (const [_, items] of similarGroups) {
    const images = new Set(items.map(i => i.imageUrl))
    if (images.size === 1) sameImg++
    else diffImg++
  }
  console.log(`\nGrupos con MISMA imagen: ${sameImg}`)
  console.log(`Grupos con imágenes DIFERENTES: ${diffImg}`)
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
