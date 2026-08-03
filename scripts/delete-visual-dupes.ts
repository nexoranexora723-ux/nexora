import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('=== ELIMINANDO PRODUCTOS CON IMAGEN DUPLICADA ===\n')
  
  // From the analysis, these products have the SAME image as another product:
  // Group 1: YP-165625234 appears 3 times (same hash ba9510ea) - delete 2 extra
  // Group 2: YP-165625220 appears 3 times (same hash 46877a32) - delete 2 extra  
  // Group 3: YP-165625258 appears 2 times (same hash 54ac69fb) - delete 1 extra
  // Group 4: YP-172234978 and YP-136891563 have same image (different hashes!) - delete 1

  // But wait - the API returned the same product multiple times!
  // Let's check if these are actually different products or the same product appearing multiple times
  
  // Check YP-165625234
  const p1 = await prisma.product.findMany({ where: { sku: 'YP-165625234' }, select: { id: true, sku: true, name: true, imageUrl: true } })
  console.log(`YP-165625234: ${p1.length} registros en BD`)
  for (const p of p1) console.log(`  ${p.id}: ${p.name.substring(0, 40)} | ${p.imageUrl?.substring(0, 40)}`)
  
  const p2 = await prisma.product.findMany({ where: { sku: 'YP-165625220' }, select: { id: true, sku: true, name: true, imageUrl: true } })
  console.log(`YP-165625220: ${p2.length} registros en BD`)
  for (const p of p2) console.log(`  ${p.id}: ${p.name.substring(0, 40)} | ${p.imageUrl?.substring(0, 40)}`)
  
  // Check if there are products with DIFFERENT SKUs but SAME imageUrl hash
  console.log('\n=== BUSCANDO PRODUCTOS CON DIFERENTE SKU PERO MISMA IMAGEN ===')
  
  // Get all products and group by image hash
  const allProducts = await prisma.product.findMany({
    select: { id: true, sku: true, name: true, imageUrl: true },
    take: 10000, // Check first 10K
  })
  
  const hashGroups = new Map<string, { id: string; sku: string; name: string }[]>()
  for (const p of allProducts) {
    const match = p.imageUrl?.match(/yupoo-img\/([a-f0-9]+)\//)
    if (match) {
      const hash = match[1]
      if (!hashGroups.has(hash)) hashGroups.set(hash, [])
      hashGroups.get(hash)!.push({ id: p.id, sku: p.sku, name: p.name })
    }
  }
  
  // Find groups where different products share the same image hash
  const sharedHashes = [...hashGroups.entries()].filter(([_, items]) => items.length > 1)
  
  if (sharedHashes.length > 0) {
    console.log(`\n¡ENCONTRADOS! ${sharedHashes.length} grupos de productos con mismo hash de imagen:`)
    
    let totalToDelete = 0
    for (const [hash, items] of sharedHashes.slice(0, 20)) {
      console.log(`\nHash ${hash} (${items.length} productos):`)
      for (const item of items.slice(0, 5)) {
        console.log(`  ${item.sku}: ${item.name.substring(0, 50)}`)
      }
      
      // Delete all except first
      const toDelete = items.slice(1).map(i => i.id)
      if (toDelete.length > 0) {
        const result = await prisma.product.deleteMany({ where: { id: { in: toDelete } } })
        totalToDelete += result.count
        console.log(`  → Eliminados: ${result.count}`)
      }
    }
    
    console.log(`\n=== TOTAL ELIMINADOS: ${totalToDelete} ===`)
  } else {
    console.log('No se encontraron productos con mismo hash de imagen.')
  }
  
  // Also check for different hashes that return same image (like YP-172234978 vs YP-136891563)
  console.log('\n=== VERIFICANDO DUPLICADOS CON HASHES DIFERENTES ===')
  // These were found in the Python analysis
  // YP-172234978 (hash 96bdc6a7) and YP-136891563 (hash ee8ef025) have same image
  const dupDiffHash = await prisma.product.findMany({
    where: { sku: { in: ['YP-172234978', 'YP-136891563'] } },
    select: { id: true, sku: true, name: true },
  })
  if (dupDiffHash.length > 1) {
    console.log(`Encontrados ${dupDiffHash.length} productos con misma imagen pero diferente hash:`)
    for (const p of dupDiffHash) {
      console.log(`  ${p.sku}: ${p.name.substring(0, 50)}`)
    }
    // Delete the second one
    const toDelete = dupDiffHash[1]
    await prisma.product.delete({ where: { id: toDelete.id } })
    console.log(`  → Eliminado: ${toDelete.sku}`)
  }
  
  console.log(`\n=== LIMPIEZA COMPLETADA ===`)
  console.log(`Productos restantes: ${await prisma.product.count()}`)
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
