import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('=== BUSCANDO IMÁGENES DUPLICADAS ===\n')
  
  // Get all products with their image hashes
  const products = await prisma.product.findMany({
    select: { id: true, sku: true, name: true, imageUrl: true },
    take: 5000,
  })
  
  // Extract hash from imageUrl
  const hashMap = new Map<string, number>()
  for (const p of products) {
    const match = p.imageUrl?.match(/yupoo-img\/([a-f0-9]+)\//)
    if (match) {
      const hash = match[1]
      hashMap.set(hash, (hashMap.get(hash) || 0) + 1)
    }
  }
  
  // Find duplicates (hash used more than once)
  const duplicates = [...hashMap.entries()].filter(([hash, count]) => count > 1).sort((a, b) => b[1] - a[1])
  
  console.log(`Total productos analizados: ${products.length}`)
  console.log(`Hashes únicos: ${hashMap.size}`)
  console.log(`Hashes duplicados: ${duplicates.length}`)
  console.log(`\nTop 20 hashes más repetidos:`)
  for (const [hash, count] of duplicates.slice(0, 20)) {
    console.log(`  ${hash}: ${count} veces`)
  }
  
  // Count total products with duplicate images
  const totalDupes = duplicates.reduce((sum, [_, count]) => sum + count, 0)
  console.log(`\nTotal productos con imagen duplicada: ${totalDupes}`)
  
  // Check for "cartera" or "wallet" category
  console.log('\n=== BUSCANDO CARTERAS/WALLETS ===')
  const wallets = await prisma.product.count({
    where: {
      OR: [
        { name: { contains: 'wallet', mode: 'insensitive' } },
        { name: { contains: 'cartera', mode: 'insensitive' } },
        { name: { contains: 'purse', mode: 'insensitive' } },
      ]
    }
  })
  console.log(`Productos con "wallet/cartera": ${wallets}`)
  
  const walletInBolsos = await prisma.product.count({
    where: {
      AND: [
        { category: { name: 'Bolsos' } },
        { OR: [
          { name: { contains: 'wallet', mode: 'insensitive' } },
          { name: { contains: 'cartera', mode: 'insensitive' } },
        ]}
      ]
    }
  })
  console.log(`Carteras dentro de Bolsos: ${walletInBolsos}`)
  
  // Check categories
  console.log('\n=== CATEGORÍAS ACTUALES ===')
  const cats = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  })
  for (const c of cats) {
    if (c._count.products > 0) {
      console.log(`  ${c.icon} ${c.name}: ${c._count.products} productos`)
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
