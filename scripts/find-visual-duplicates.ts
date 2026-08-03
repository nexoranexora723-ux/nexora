import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
const prisma = new PrismaClient()

async function main() {
  console.log('=== BUSCANDO IMÁGENES VISUALMENTE DUPLICADAS ===\n')
  
  // Get first 500 products
  const products = await prisma.product.findMany({
    select: { id: true, sku: true, name: true, imageUrl: true },
    take: 500,
  })
  
  console.log(`Verificando ${products.length} productos...`)
  
  // Download each image and compute MD5
  const md5Map = new Map<string, { sku: string; name: string; imageUrl: string }[]>()
  let checked = 0
  
  for (const p of products) {
    if (!p.imageUrl) continue
    
    // Extract hash from URL
    const match = p.imageUrl.match(/yupoo-img\/([a-f0-9]+)\//)
    if (!match) continue
    
    const hash = match[1]
    const proxyUrl = `https://nexora-inky-mu.vercel.app/api/yupoo-img/${hash}/big`
    
    try {
      const resp = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) })
      if (!resp.ok) continue
      const buffer = Buffer.from(await resp.arrayBuffer())
      const md5 = createHash('md5').update(buffer).digest('hex')
      
      if (!md5Map.has(md5)) md5Map.set(md5, [])
      md5Map.get(md5)!.push({ sku: p.sku, name: p.name, imageUrl: p.imageUrl })
      
      checked++
      if (checked % 50 === 0) console.log(`  Verificadas: ${checked}/${products.length}`)
    } catch (e) {
      // skip
    }
  }
  
  // Find duplicates
  const dupes = [...md5Map.entries()].filter(([_, items]) => items.length > 1)
  
  console.log(`\n=== RESULTADO ===`)
  console.log(`Imágenes verificadas: ${checked}`)
  console.log(`MD5 únicos: ${md5Map.size}`)
  console.log(`IMÁGENES DUPLICADAS: ${dupes.length} grupos`)
  
  let totalDupProducts = 0
  for (const [md5, items] of dupes) {
    totalDupProducts += items.length
    console.log(`\nMD5: ${md5.substring(0, 16)}... (${items.length} productos con MISMA imagen):`)
    for (const item of items) {
      console.log(`  ${item.sku}: ${item.name.substring(0, 55)}`)
      console.log(`    img: ${item.imageUrl.substring(0, 50)}`)
    }
  }
  
  console.log(`\nTotal productos con imagen duplicada: ${totalDupProducts}`)
  console.log(`Total productos a eliminar (mantener 1 por grupo): ${totalDupProducts - dupes.length}`)
  
  // Save duplicate SKUs to file for cleanup
  if (dupes.length > 0) {
    const { writeFileSync } = await import('fs')
    const dupeSkus: string[] = []
    for (const [_, items] of dupes) {
      // Keep first, mark rest for deletion
      for (let i = 1; i < items.length; i++) {
        dupeSkus.push(items[i].sku)
      }
    }
    writeFileSync('/tmp/dupe-skus.json', JSON.stringify(dupeSkus))
    console.log(`\nSKUs duplicados guardados en /tmp/dupe-skus.json`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
