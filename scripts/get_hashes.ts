import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const products = await prisma.product.findMany({ select: { sku: true, imageUrl: true }, take: 100 })
  const hashes: string[] = []
  for (const p of products) {
    const m = p.imageUrl?.match(/yupoo-img\/([a-f0-9]+)\//)
    if (m) hashes.push(`${m[1]}|${p.sku}`)
  }
  // Write to file
  const { writeFileSync } = await import('fs')
  writeFileSync('/tmp/product-hashes.txt', hashes.join('\n'))
  console.log(`Wrote ${hashes.length} hashes`)
}
main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
