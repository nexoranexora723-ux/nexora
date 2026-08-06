import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('📸 Mejorando calidad: medium → big (SQL directo)...')
  
  // Use raw SQL for fast bulk update
  const result1 = await prisma.$executeRawUnsafe(
    `UPDATE products SET image_url = REPLACE(image_url, '/medium', '/big') WHERE image_url LIKE '%/medium%'`
  )
  console.log(`imageUrl actualizadas: ${result1}`)
  
  // Update images JSON field - replace /medium with /big in the JSON string
  const result2 = await prisma.$executeRawUnsafe(
    `UPDATE products SET images = REPLACE(images, '/medium', '/big') WHERE images LIKE '%/medium%'`
  )
  console.log(`images (gallery) actualizadas: ${result2}`)
  
  // Verify
  const sample = await prisma.product.findFirst({
    where: { imageUrl: { contains: '/big' } },
    select: { sku: true, imageUrl: true },
  })
  console.log(`\nVerificación:`)
  console.log(`  ${sample?.sku}: ${sample?.imageUrl}`)
  
  const remaining = await prisma.product.count({
    where: { imageUrl: { contains: '/medium' } }
  })
  console.log(`\nProductos aún con 'medium': ${remaining}`)
  console.log(`¡Listo! Todas las imágenes ahora usan calidad 'big' (alta resolución)`)
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
