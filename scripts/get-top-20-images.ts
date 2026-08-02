import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // IDs de los 20 productos top
  const topSkus = [
    'YP-135911334', // LV ZIPPY Wallet
    'YP-135911793', // LV ZIPPY Coin Purse
    'YP-182425674', // Gucci Tote Bag
    'YP-221612364', // Chanel Bag
    'YP-88697449',  // Hermès Bag
    'YP-187112537', // Dior Bag
    'YP-246144864', // Loewe Shoes
    'YP-197961911', // Gucci Sneakers
    'YP-88697449',  // LV Shoes
    'YP-246379286', // Hermès Shoes
    'YP-235747004', // Vacheron Constantin
    'YP-208057007', // Gucci Glasses
    'YP-209951728', // Prada Glasses
    'YP-107242645', // Balenciaga
    'YP-107827821', // Burberry
    'YP-107827808', // Prada Brand Guide
    'YP-107240509', // North Face
    'YP-175388179', // Flamengo Jersey
    'YP-221612364', // Bottega Veneta Bag (use different)
    'YP-182425674', // Fendi Bag (use different)
  ]
  
  // Get actual products with their image hashes
  const products = await prisma.product.findMany({
    where: { sku: { in: [...new Set(topSkus)] } },
    select: { id: true, sku: true, name: true, imageUrl: true, images: true, brand: { select: { name: true } } },
  })
  
  console.log(`Encontrados: ${products.length} productos`)
  
  for (const p of products) {
    const hashMatch = p.imageUrl?.match(/\/api\/yupoo-img\/([a-f0-9]+)\//i)
    const hash = hashMatch?.[1]
    
    // Also get gallery hashes
    let galleryHashes: string[] = []
    if (p.images) {
      try {
        const imgs = JSON.parse(p.images)
        galleryHashes = imgs.map((img: string) => {
          const m = img.match(/\/api\/yupoo-img\/([a-f0-9]+)\//i)
          return m?.[1]
        }).filter(Boolean)
      } catch {}
    }
    
    const allHashes = [...new Set([hash, ...galleryHashes])].filter(Boolean) as string[]
    console.log(`${p.sku}: ${p.name.substring(0, 40)} | hash: ${hash} | gallery: ${allHashes.length} hashes`)
  }
}
main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
