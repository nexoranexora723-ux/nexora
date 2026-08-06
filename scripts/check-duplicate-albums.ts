import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Check products with same imageUrl (not just same hash)
  console.log('=== PRODUCTOS CON MISMA imageUrl ===\n')
  
  const products = await prisma.product.findMany({
    select: { id: true, sku: true, name: true, imageUrl: true },
    take: 10000,
  })
  
  const urlMap = new Map<string, { count: number; samples: string[] }>()
  for (const p of products) {
    if (!p.imageUrl) continue
    if (!urlMap.has(p.imageUrl)) {
      urlMap.set(p.imageUrl, { count: 0, samples: [] })
    }
    const entry = urlMap.get(p.imageUrl)!
    entry.count++
    if (entry.samples.length < 3) entry.samples.push(`${p.sku}: ${p.name.substring(0, 40)}`)
  }
  
  const dupes = [...urlMap.entries()].filter(([url, data]) => data.count > 1).sort((a, b) => b[1].count - a[1].count)
  
  console.log(`URLs de imagen únicas: ${urlMap.size}`)
  console.log(`URLs usadas en más de 1 producto: ${dupes.length}`)
  
  if (dupes.length > 0) {
    console.log(`\nTop 20 imágenes más repetidas:`)
    for (const [url, data] of dupes.slice(0, 20)) {
      console.log(`  ${url.substring(0, 50)}... (${data.count} veces)`)
      for (const s of data.samples) {
        console.log(`    → ${s}`)
      }
    }
    
    const totalDupes = dupes.reduce((sum, [_, data]) => sum + data.count - 1, 0)
    console.log(`\nTotal productos con imagen duplicada: ${totalDupes}`)
  }
  
  // Also check gallery images for duplicates
  console.log('\n=== VERIFICANDO GALERÍAS (images field) ===')
  const withGallery = await prisma.product.findMany({
    where: { images: { not: null } },
    select: { sku: true, images: true },
    take: 20,
  })
  
  for (const p of withGallery.slice(0, 5)) {
    try {
      const imgs = JSON.parse(p.images || '[]')
      const unique = [...new Set(imgs)]
      if (imgs.length !== unique.length) {
        console.log(`  ${p.sku}: ${imgs.length} fotos, ${unique.length} únicas — DUPLICADAS`)
      }
    } catch {}
  }
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
