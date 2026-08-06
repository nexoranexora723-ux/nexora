import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('=== VERIFICANDO CANTIDAD DE FOTOS POR PRODUCTO ===\n')
  
  const products = await prisma.product.findMany({
    select: { sku: true, name: true, imageUrl: true, images: true },
    take: 5000,
  })
  
  let onePhoto = 0
  let multiPhoto = 0
  let noPhoto = 0
  
  const onePhotoSamples: string[] = []
  
  for (const p of products) {
    let gallery: string[] = []
    try { gallery = JSON.parse(p.images || '[]') } catch {}
    
    if (gallery.length <= 1) {
      onePhoto++
      if (onePhotoSamples.length < 10) {
        onePhotoSamples.push(`  ${p.sku}: ${p.name.substring(0, 50)} | img: ${p.imageUrl?.substring(0, 40)}`)
      }
    } else {
      multiPhoto++
    }
  }
  
  console.log(`Total productos (muestra 5000): ${products.length}`)
  console.log(`Con 1 sola foto: ${onePhoto} (${Math.round(onePhoto/products.length*100)}%)`)
  console.log(`Con múltiples fotos: ${multiPhoto} (${Math.round(multiPhoto/products.length*100)}%)`)
  
  console.log('\nMuestras de productos con 1 sola foto:')
  for (const s of onePhotoSamples) console.log(s)
  
  // Check if products with 1 photo share the same imageUrl
  console.log('\n=== VERIFICANDO SI PRODUCTOS CON 1 FOTO COMPARTEN imageUrl ===')
  const onePhotoProducts = products.filter(p => {
    let g: string[] = []
    try { g = JSON.parse(p.images || '[]') } catch {}
    return g.length <= 1
  })
  
  const urlMap = new Map<string, number>()
  for (const p of onePhotoProducts) {
    if (!p.imageUrl) continue
    urlMap.set(p.imageUrl, (urlMap.get(p.imageUrl) || 0) + 1)
  }
  
  const shared = [...urlMap.entries()].filter(([_, count]) => count > 1).sort((a, b) => b[1] - a[1])
  console.log(`URLs compartidas: ${shared.length}`)
  if (shared.length > 0) {
    console.log('\nTop 20 URLs más compartidas:')
    for (const [url, count] of shared.slice(0, 20)) {
      console.log(`  ${url.substring(0, 45)}... → ${count} productos`)
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
