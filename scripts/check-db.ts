import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const total = await prisma.product.count()
  const yupoo = await prisma.product.count({ where: { sku: { startsWith: 'YP-' } } })
  const nonYupoo = await prisma.product.count({ where: { sku: { not: { startsWith: 'YP-' } } } })
  console.log(`Total productos: ${total}`)
  console.log(`Productos Yupoo (YP-): ${yupoo}`)
  console.log(`Productos no-Yupoo: ${nonYupoo}`)
  
  const activeYupoo = await prisma.product.count({ 
    where: { sku: { startsWith: 'YP-' }, status: 'ACTIVE' } 
  })
  const inactiveYupoo = await prisma.product.count({ 
    where: { sku: { startsWith: 'YP-' }, status: { not: 'ACTIVE' } } 
  })
  console.log(`Yupoo ACTIVE: ${activeYupoo}`)
  console.log(`Yupoo INACTIVE: ${inactiveYupoo}`)
  
  const sample = await prisma.product.findMany({
    where: { sku: { startsWith: 'YP-' } },
    select: { sku: true, name: true, status: true },
    take: 5,
  })
  console.log('\nMuestras Yupoo:')
  for (const s of sample) {
    console.log(`  ${s.sku}: ${s.name.substring(0, 40)} (status: ${s.status})`)
  }
}
main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
