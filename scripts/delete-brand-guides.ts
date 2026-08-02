import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Delete products that are "Brand Guide" or "Items" (not real products)
  const deleted = await prisma.product.deleteMany({
    where: { OR: [
      { name: { contains: 'Brand Guide', mode: 'insensitive' } },
      { name: { contains: 'Items', mode: 'insensitive' } },
    ]}
  })
  
  console.log(`=== PRODUCTOS ELIMINADOS: ${deleted.count} ===`)
  console.log('(Eran páginas de categoría de Yupoo, no productos reales)')
  
  const total = await prisma.product.count()
  console.log(`\nTotal productos restantes: ${total}`)
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
