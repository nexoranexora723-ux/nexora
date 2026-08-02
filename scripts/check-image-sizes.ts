import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Check what image URLs look like
  const products = await prisma.product.findMany({
    select: { sku: true, imageUrl: true, images: true },
    take: 5,
  })
  
  for (const p of products) {
    console.log(`${p.sku}:`)
    console.log(`  imageUrl: ${p.imageUrl}`)
    if (p.images) {
      try {
        const imgs = JSON.parse(p.images)
        console.log(`  gallery[0]: ${imgs[0]}`)
        console.log(`  gallery count: ${imgs.length}`)
      } catch {}
    }
    console.log()
  }
}
main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
