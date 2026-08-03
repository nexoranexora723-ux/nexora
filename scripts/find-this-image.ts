import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('=== BUSCANDO PRODUCTOS CON ESTA IMAGEN ===\n')
  
  // The image is a Louis Vuitton bag with "CITY" in the name
  // It appears to be a Keepall/shoulder bag with beige/cream color and VII stripe
  
  // Search by name keywords
  const results = await prisma.product.findMany({
    where: {
      AND: [
        { brand: { name: { contains: 'Louis Vuitton', mode: 'insensitive' } } },
        {
          OR: [
            { name: { contains: 'CITY', mode: 'insensitive' } },
            { name: { contains: 'Keepall', mode: 'insensitive' } },
            { name: { contains: 'Keep All', mode: 'insensitive' } },
            { name: { contains: 'Shoulder', mode: 'insensitive' } },
            { name: { contains: 'Trunk', mode: 'insensitive' } },
          ]
        }
      ]
    },
    select: { sku: true, name: true, imageUrl: true, estimatedCost: true },
    take: 50,
    orderBy: { name: 'asc' },
  })
  
  console.log(`Productos encontrados: ${results.length}\n`)
  for (const p of results) {
    console.log(`  ${p.sku}: ${p.name.substring(0, 60)} | $${p.estimatedCost} | img: ${p.imageUrl?.substring(0, 45)}`)
  }
  
  // Also search for the specific hash we know
  console.log('\n=== BUSCANDO POR HASHES CONOCIDOS ===')
  const knownHashes = ['46877a32', '40926cdb', '780e18d4'] // hashes from top20 products
  for (const hash of knownHashes) {
    const products = await prisma.product.findMany({
      where: { imageUrl: { contains: hash } },
      select: { sku: true, name: true },
    })
    console.log(`  Hash ${hash}: ${products.length} productos`)
    for (const p of products.slice(0, 3)) {
      console.log(`    ${p.sku}: ${p.name.substring(0, 50)}`)
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
