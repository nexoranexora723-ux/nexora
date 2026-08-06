import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Limpiando "Yupoo" de características y descripciones...\n')
  
  // 1. Update features: replace "Importado desde Yupoo" with "Importado desde China"
  const featuresUpdated = await prisma.$executeRawUnsafe(
    `UPDATE products SET features = REPLACE(features, 'Importado desde Yupoo', 'Importado desde China') WHERE features LIKE '%Yupoo%'`
  )
  console.log(`Features actualizadas: ${featuresUpdated}`)
  
  // 2. Update description: replace any "Yupoo" with "China"
  const descUpdated = await prisma.$executeRawUnsafe(
    `UPDATE products SET description = REPLACE(description, 'Yupoo', 'China') WHERE description LIKE '%Yupoo%'`
  )
  console.log(`Descriptions actualizadas: ${descUpdated}`)
  
  // 3. Update longDescription: replace any "Yupoo" with "China"
  const longUpdated = await prisma.$executeRawUnsafe(
    `UPDATE products SET long_description = REPLACE(long_description, 'Yupoo', 'China') WHERE long_description LIKE '%Yupoo%'`
  )
  console.log(`longDescription actualizadas: ${longUpdated}`)
  
  // 4. Also clean "paypalshop" references
  const paypalDesc = await prisma.$executeRawUnsafe(
    `UPDATE products SET description = REPLACE(description, 'paypalshop', 'China') WHERE description LIKE '%paypalshop%'`
  )
  const paypalLong = await prisma.$executeRawUnsafe(
    `UPDATE products SET long_description = REPLACE(long_description, 'paypalshop', 'China') WHERE long_description LIKE '%paypalshop%'`
  )
  console.log(`paypalshop en description: ${paypalDesc}`)
  console.log(`paypalshop en longDescription: ${paypalLong}`)
  
  // Verify
  const sample = await prisma.product.findFirst({
    select: { sku: true, features: true, description: true },
  })
  console.log(`\nVerificación (${sample?.sku}):`)
  console.log(`  features: ${sample?.features}`)
  console.log(`  description: ${sample?.description}`)
  
  // Count remaining Yupoo references
  const remaining = await prisma.product.count({
    where: { OR: [
      { features: { contains: 'yupoo', mode: 'insensitive' } },
      { features: { contains: 'Yupoo' } },
      { description: { contains: 'yupoo', mode: 'insensitive' } },
      { description: { contains: 'Yupoo' } },
      { longDescription: { contains: 'yupoo', mode: 'insensitive' } },
      { longDescription: { contains: 'Yupoo' } },
    ]}
  })
  console.log(`\nProductos con "Yupoo" restantes: ${remaining}`)
  console.log('¡Listo! Todas las referencias a Yupoo han sido eliminadas.')
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
