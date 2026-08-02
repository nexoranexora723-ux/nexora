import { PrismaClient } from '@prisma/client'
import { readdirSync } from 'fs'
const prisma = new PrismaClient()

async function main() {
  // Map product names to SKUs
  const productMap: Record<string, string> = {
    'LV-ZIPPY-Wallet': 'YP-135911334',
    'LV-ZIPPY-Coin-Purse': 'YP-135911793',
    'Gucci-Tote-Bag': 'YP-182425674',
    'Dior-Bag': 'YP-221612364',
    'DG-Bag': 'YP-187112537',
    'Loewe-Shoes': 'YP-246144864',
    'Gucci-Sneakers': 'YP-197961911',
    'LV-Shoes': 'YP-88697449',
    'Hermes-Shoes': 'YP-246379286',
    'Vacheron-Constantin': 'YP-235747004',
    'Gucci-Glasses': 'YP-208057007',
    'Prada-Glasses': 'YP-209951728',
    'Balenciaga': 'YP-107242645',
    'Burberry': 'YP-107827821',
    'Prada-Guide': 'YP-107827808',
    'North-Face': 'YP-107240509',
    'Flamengo-Jersey': 'YP-175388179',
  }

  const files = readdirSync('public/products/top20')
  
  let updated = 0
  let totalPhotos = 0
  
  for (const [name, sku] of Object.entries(productMap)) {
    // Find all files for this product
    const productFiles = files
      .filter(f => f.startsWith(name + '-'))
      .sort((a, b) => {
        const aIdx = parseInt(a.match(/-(\d+)\./)?.[1] ?? '0')
        const bIdx = parseInt(b.match(/-(\d+)\./)?.[1] ?? '0')
        return aIdx - bIdx
      })
    
    if (productFiles.length === 0) continue
    
    // Build local paths
    const localPaths = productFiles.map(f => `/products/top20/${f}`)
    const coverPath = localPaths[0] // First image is cover (index 0)
    
    // Update product in database
    try {
      await prisma.product.update({
        where: { sku },
        data: {
          imageUrl: coverPath,
          images: JSON.stringify(localPaths),
        },
      })
      updated++
      totalPhotos += localPaths.length
      console.log(`✓ ${name} (${sku}): ${localPaths.length} fotos locales`)
    } catch (error) {
      console.log(`✗ ${name} (${sku}): error`)
    }
  }
  
  console.log(`\n=== DONE: ${updated} productos actualizados, ${totalPhotos} fotos locales ===`)
  
  // Verify
  const sample = await prisma.product.findFirst({
    where: { sku: 'YP-182425674' },
    select: { name: true, imageUrl: true, images: true },
  })
  console.log('\nVerificación (Gucci Tote Bag):')
  console.log(`  imageUrl: ${sample?.imageUrl}`)
  console.log(`  images: ${sample?.images?.substring(0, 200)}...`)
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
