import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('📸 Mejorando calidad de imágenes: medium → big...\n')
  
  // Update all products that use /medium to /big
  const products = await prisma.product.findMany({
    where: { imageUrl: { contains: '/medium' } },
    select: { id: true, imageUrl: true, images: true },
  })
  console.log(`Productos con imágenes en 'medium': ${products.length}`)
  
  let updated = 0
  const BATCH = 500
  
  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH)
    
    for (const p of batch) {
      const newImageUrl = p.imageUrl?.replace('/medium', '/big') || null
      let newImages = p.images
      
      if (newImages) {
        try {
          const imgs = JSON.parse(newImages)
          const newImgs = imgs.map((url: string) => url.replace('/medium', '/big'))
          newImages = JSON.stringify(newImgs)
        } catch {}
      }
      
      try {
        await prisma.product.update({
          where: { id: p.id },
          data: {
            imageUrl: newImageUrl,
            images: newImages,
          },
        })
        updated++
      } catch {}
    }
    
    if ((i + BATCH) % 5000 === 0 || i + BATCH >= products.length) {
      console.log(`  Procesados: ${Math.min(i + BATCH, products.length)}/${products.length} | Actualizados: ${updated}`)
    }
  }
  
  console.log(`\n=== DONE: ${updated} productos actualizados a calidad 'big' ===`)
  
  // Verify
  const sample = await prisma.product.findFirst({
    where: { imageUrl: { contains: '/big' } },
    select: { sku: true, imageUrl: true, images: true },
  })
  console.log(`\nVerificación:`)
  console.log(`  imageUrl: ${sample?.imageUrl}`)
  if (sample?.images) {
    const imgs = JSON.parse(sample.images)
    console.log(`  gallery[0]: ${imgs[0]}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
