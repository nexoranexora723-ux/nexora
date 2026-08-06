import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Create Carteras category
  let carteras = await prisma.category.findFirst({ where: { slug: 'carteras' } })
  if (!carteras) {
    carteras = await prisma.category.create({
      data: { name: 'Carteras', slug: 'carteras', icon: '👛' }
    })
    console.log(`✓ Categoría creada: ${carteras.icon} ${carteras.name}`)
  }
  
  // Find products with "wallet" or "cartera" in name
  const wallets = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: 'wallet', mode: 'insensitive' } },
        { name: { contains: 'cartera', mode: 'insensitive' } },
        { name: { contains: 'coin purse', mode: 'insensitive' } },
        { name: { contains: 'purse', mode: 'insensitive' } },
      ]
    },
    select: { id: true, name: true },
  })
  
  console.log(`Productos de carteras encontrados: ${wallets.length}`)
  
  // Update all to new category
  const result = await prisma.product.updateMany({
    where: { id: { in: wallets.map(w => w.id) } },
    data: { categoryId: carteras.id },
  })
  
  console.log(`✓ Movidos a Carteras: ${result.count}`)
  
  // Show samples
  console.log('\nMuestras:')
  const samples = await prisma.product.findMany({
    where: { categoryId: carteras.id },
    select: { name: true, brand: { select: { name: true } } },
    take: 10,
  })
  for (const s of samples) {
    console.log(`  [${s.brand?.name}] ${s.name.substring(0, 50)}`)
  }
  
  // Final distribution
  console.log('\n=== DISTRIBUCIÓN FINAL ===')
  const cats = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  })
  for (const c of cats) {
    if (c._count.products > 0) {
      console.log(`  ${c.icon} ${c.name}: ${c._count.products} productos`)
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
