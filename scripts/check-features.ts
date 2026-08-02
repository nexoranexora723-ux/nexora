import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Check product features field
  const products = await prisma.product.findMany({
    select: { sku: true, name: true, features: true },
    take: 5,
  })
  
  for (const p of products) {
    console.log(`${p.sku}: ${p.name.substring(0, 40)}`)
    if (p.features) {
      try {
        const feats = JSON.parse(p.features)
        console.log(`  features: ${JSON.stringify(feats)}`)
      } catch {
        console.log(`  features: ${p.features}`)
      }
    }
    console.log()
  }
  
  // Count products with "yupoo" in features
  const yupooFeatures = await prisma.product.count({
    where: { features: { contains: 'yupoo', mode: 'insensitive' } }
  })
  console.log(`Productos con "yupoo" en features: ${yupooFeatures}`)
  
  // Count products with "Yupoo" in description
  const yupooDesc = await prisma.product.count({
    where: { description: { contains: 'yupoo', mode: 'insensitive' } }
  })
  console.log(`Productos con "yupoo" en description: ${yupooDesc}`)
  
  // Count products with "Yupoo" in longDescription
  const yupooLong = await prisma.product.count({
    where: { longDescription: { contains: 'yupoo', mode: 'insensitive' } }
  })
  console.log(`Productos con "yupoo" en longDescription: ${yupooLong}`)
}
main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
