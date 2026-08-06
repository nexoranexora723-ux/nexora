import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Find products with no imageUrl or suspicious imageUrl
  const noImage = await prisma.product.count({
    where: { OR: [{ imageUrl: null }, { imageUrl: '' }] }
  })
  console.log(`Productos sin imagen: ${noImage}`)
  
  // Find products with "Brand Guide" or "Items" in name (these are category pages, not real products)
  const brandGuides = await prisma.product.count({
    where: { OR: [
      { name: { contains: 'Brand Guide', mode: 'insensitive' } },
      { name: { contains: 'Items', mode: 'insensitive' } },
      { name: { contains: 'Brand guide', mode: 'insensitive' } },
    ]}
  })
  console.log(`Productos "Brand Guide" o "Items" (no son productos reales): ${brandGuides}`)
  
  // Show samples
  const samples = await prisma.product.findMany({
    where: { OR: [
      { name: { contains: 'Brand Guide', mode: 'insensitive' } },
      { name: { contains: 'Items', mode: 'insensitive' } },
    ]},
    select: { sku: true, name: true, brand: { select: { name: true } }, imageUrl: true },
    take: 10,
  })
  console.log('\nMuestras de productos "Brand Guide":')
  for (const s of samples) {
    console.log(`  ${s.sku}: [${s.brand?.name}] ${s.name.substring(0, 50)} | img: ${s.imageUrl?.substring(0, 40)}`)
  }
  
  // Count products with only 1 photo (gallery = [] or 1 image)
  const allProducts = await prisma.product.findMany({
    select: { id: true, images: true },
    take: 1000,
  })
  const onePhoto = allProducts.filter(p => {
    try {
      const imgs = JSON.parse(p.images || '[]')
      return imgs.length <= 1
    } catch {
      return true
    }
  })
  console.log(`\nProductos con 0-1 fotos (de muestra de 1000): ${onePhoto.length}`)
  
  // Total products with "Brand Guide" or "Items"
  console.log(`\n=== RESUMEN ===`)
  console.log(`Total productos: ${await prisma.product.count()}`)
  console.log(`"Brand Guide/Items" (no son productos): ${brandGuides}`)
  console.log(`Sin imagen: ${noImage}`)
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
