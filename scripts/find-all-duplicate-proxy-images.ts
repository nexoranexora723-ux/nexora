import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
const prisma = new PrismaClient()

async function main() {
  console.log('=== BUSCANDO IMÁGENES DUPLICADAS DEL PROXY ===\n')
  
  // Get all unique hashes from products
  const products = await prisma.product.findMany({
    select: { sku: true, name: true, imageUrl: true },
    take: 1000, // Start with 1000 to test
  })
  
  // Extract hashes
  const hashList: { sku: string; name: string; hash: string }[] = []
  for (const p of products) {
    const match = p.imageUrl?.match(/yupoo-img\/([a-f0-9]+)\//)
    if (match) {
      hashList.push({ sku: p.sku, name: p.name, hash: match[1] })
    }
  }
  
  console.log(`Productos a verificar: ${hashList.length}`)
  console.log(`Hashes únicos: ${new Set(hashList.map(h => h.hash)).size}`)
  
  // Download each image and compute MD5
  console.log('\nDescargando imágenes para comparar...')
  const md5Map = new Map<string, { hash: string; sku: string; name: string }[]>()
  
  let checked = 0
  for (const item of hashList.slice(0, 200)) { // Check first 200
    try {
      const resp = await fetch(`https://nexora-inky-mu.vercel.app/api/yupoo-img/${item.hash}/big`)
      if (!resp.ok) continue
      const buffer = Buffer.from(await resp.arrayBuffer())
      const md5 = createHash('md5').update(buffer).digest('hex')
      
      if (!md5Map.has(md5)) md5Map.set(md5, [])
      md5Map.get(md5)!.push({ hash: item.hash, sku: item.sku, name: item.name })
      
      checked++
      if (checked % 50 === 0) console.log(`  Verificadas: ${checked}/${Math.min(200, hashList.length)}`)
    } catch {}
  }
  
  // Find duplicates
  const dupes = [...md5Map.entries()].filter(([_, items]) => items.length > 1)
  
  console.log(`\n=== RESULTADOS ===`)
  console.log(`Imágenes verificadas: ${checked}`)
  console.log(`MD5 únicos: ${md5Map.size}`)
  console.log(`IMÁGENES DUPLICADAS: ${dupes.length} grupos`)
  
  let totalAffected = 0
  for (const [md5, items] of dupes) {
    totalAffected += items.length
    console.log(`\nMD5: ${md5.substring(0, 12)}... (${items.length} productos con misma imagen):`)
    for (const item of items.slice(0, 5)) {
      console.log(`  ${item.sku}: ${item.name.substring(0, 50)} | hash: ${item.hash}`)
    }
    if (items.length > 5) console.log(`  ... y ${items.length - 5} más`)
  }
  
  console.log(`\nTotal productos con imagen duplicada: ${totalAffected}`)
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
