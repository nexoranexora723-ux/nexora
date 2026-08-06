import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Check ALL products (not just 5000)
  console.log('=== ANÁLISIS COMPLETO DE DUPLICADOS ===\n')
  
  // 1. Check products with same imageUrl
  const allProducts = await prisma.product.findMany({
    select: { sku: true, name: true, imageUrl: true, images: true },
  })
  
  console.log(`Total productos: ${allProducts.length}`)
  
  // Group by imageUrl
  const urlGroups = new Map<string, string[]>()
  for (const p of allProducts) {
    if (!p.imageUrl) continue
    if (!urlGroups.has(p.imageUrl)) urlGroups.set(p.imageUrl, [])
    urlGroups.get(p.imageUrl)!.push(p.sku)
  }
  
  const dupeUrls = [...urlGroups.entries()].filter(([_, skus]) => skus.length > 1)
  console.log(`\nURLs de imagen únicas: ${urlGroups.size}`)
  console.log(`URLs compartidas por múltiples productos: ${dupeUrls.length}`)
  
  if (dupeUrls.length > 0) {
    const totalAffected = dupeUrls.reduce((sum, [_, skus]) => sum + skus.length, 0)
    console.log(`Total productos afectados: ${totalAffected}`)
    
    console.log(`\nTop 30 imágenes más repetidas:`)
    const sorted = dupeUrls.sort((a, b) => b[1].length - a[1].length).slice(0, 30)
    for (const [url, skus] of sorted) {
      console.log(`  ${url.substring(0, 50)}... → ${skus.length} productos`)
      // Show sample names
      for (const sku of skus.slice(0, 2)) {
        const p = allProducts.find(pp => pp.sku === sku)
        console.log(`    ${sku}: ${p?.name.substring(0, 50)}`)
      }
    }
    
    // Count how many to delete (keep first, delete rest)
    const toDelete = dupeUrls.reduce((sum, [_, skus]) => sum + skus.length - 1, 0)
    console.log(`\nProductos duplicados a eliminar: ${toDelete}`)
  }
  
  // 2. Check gallery images for duplicates within same product
  let galleryDupes = 0
  for (const p of allProducts) {
    if (!p.images) continue
    try {
      const imgs = JSON.parse(p.images)
      const unique = [...new Set(imgs)]
      if (imgs.length !== unique.length) galleryDupes++
    } catch {}
  }
  console.log(`\nProductos con fotos duplicadas en galería: ${galleryDupes}`)
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
