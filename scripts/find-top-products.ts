import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // 1. Featured products
  console.log('=== PRODUCTOS DESTACADOS ===')
  const featured = await prisma.product.findMany({
    where: { isFeatured: true, status: 'ACTIVE' },
    select: { sku: true, name: true, brand: { select: { name: true } }, category: { select: { name: true, icon: true } }, imageUrl: true, estimatedCost: true },
    take: 20,
  })
  for (const p of featured) {
    console.log(`  ${p.sku}: [${p.brand?.name}] ${p.name.substring(0, 55)} | ${p.category?.icon} ${p.category?.name} | $${p.estimatedCost} | img: ${p.imageUrl?.substring(0, 50)}`)
  }
  
  // 2. Top brands by product count
  console.log('\n=== TOP MARCAS POR CANTIDAD ===')
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: { where: { status: 'ACTIVE' } } } } },
    orderBy: { products: { _count: 'desc' } },
    take: 15,
  })
  for (const b of brands) {
    console.log(`  ${b.name}: ${b._count.products} productos`)
  }
  
  // 3. Sample products from top brands (1 per brand)
  console.log('\n=== MEJOR PRODUCTO POR MARCA TOP ===')
  for (const b of brands.slice(0, 15)) {
    const product = await prisma.product.findFirst({
      where: { brandId: b.id, status: 'ACTIVE', imageUrl: { not: null } },
      select: { sku: true, name: true, category: { select: { name: true, icon: true } }, imageUrl: true, estimatedCost: true },
      orderBy: { isFeatured: 'desc' },
    })
    if (product) {
      console.log(`  [${b.name}] ${product.name.substring(0, 50)} | ${product.category?.icon} ${product.category?.name} | $${product.estimatedCost} | img: ${product.imageUrl?.substring(0, 40)}...`)
    }
  }
  
  // 4. Products with highest ratings
  console.log('\n=== PRODUCTOS MEJOR CALIFICADOS ===')
  const topRated = await prisma.product.findMany({
    where: { status: 'ACTIVE', rating: { gte: 4.7 } },
    select: { sku: true, name: true, brand: { select: { name: true } }, category: { select: { name: true, icon: true } }, rating: true, estimatedCost: true },
    orderBy: { rating: 'desc' },
    take: 10,
  })
  for (const p of topRated) {
    console.log(`  ${p.sku}: [${p.brand?.name}] ${p.name.substring(0, 50)} | ⭐${p.rating} | ${p.category?.icon} ${p.category?.name} | $${p.estimatedCost}`)
  }
  
  // 5. Products with most photos (gallery)
  console.log('\n=== PRODUCTOS CON MÁS FOTOS ===')
  const withGallery = await prisma.product.findMany({
    where: { status: 'ACTIVE', images: { not: null } },
    select: { sku: true, name: true, brand: { select: { name: true } }, images: true, category: { select: { name: true, icon: true } } },
    take: 5000,
  })
  const sorted = withGallery
    .map(p => {
      let count = 0
      try { count = JSON.parse(p.images || '[]').length } catch {}
      return { ...p, photoCount: count }
    })
    .sort((a, b) => b.photoCount - a.photoCount)
    .slice(0, 15)
  for (const p of sorted) {
    console.log(`  ${p.sku}: [${p.brand?.name}] ${p.name.substring(0, 45)} | 📸${p.photoCount} fotos | ${p.category?.icon} ${p.category?.name}`)
  }
}
main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
