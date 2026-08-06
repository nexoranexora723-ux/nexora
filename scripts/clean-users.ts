import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('=== USUARIOS ACTUALES ===')
  const users = await prisma.user.findMany({
    select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true },
  })
  for (const u of users) {
    console.log(`  ${u.role.padEnd(12)} | ${u.email.padEnd(35)} | ${u.firstName} ${u.lastName}`)
  }
  
  // Keep only nexoranexora723@gmail.com, delete all others
  console.log('\n=== ELIMINANDO USUARIOS DE PRUEBA ===')
  const deleted = await prisma.user.deleteMany({
    where: {
      NOT: { email: 'nexoranexora723@gmail.com' }
    }
  })
  console.log(`Eliminados: ${deleted.count} usuarios de prueba`)
  
  // Verify
  console.log('\n=== USUARIOS RESTANTES ===')
  const remaining = await prisma.user.findMany({
    select: { firstName: true, lastName: true, email: true, role: true },
  })
  for (const u of remaining) {
    console.log(`  ${u.role} | ${u.email} | ${u.firstName} ${u.lastName}`)
  }
  
  // Also clean supplier ratings (they were test data)
  console.log('\n=== LIMPIANDO CALIFICACIONES DE PROVEEDORES ===')
  const ratingsDeleted = await prisma.supplierRating.deleteMany({})
  console.log(`Eliminadas: ${ratingsDeleted.count} calificaciones`)
  
  // Final state
  console.log('\n=== ESTADO FINAL ===')
  console.log(`  Usuarios: ${await prisma.user.count()}`)
  console.log(`  Productos: ${await prisma.product.count()}`)
  console.log(`  Marcas: ${await prisma.brand.count()}`)
  console.log(`  Categorías: ${await prisma.category.count()}`)
  console.log(`  Proveedores: ${await prisma.supplier.count()}`)
  console.log(`  Empresa: ${await prisma.company.count()}`)
  console.log(`  Solicitudes: ${await prisma.importRequest.count()}`)
  console.log(`  Pedidos: ${await prisma.importRequest.count()}`)
  console.log(`  Transacciones: ${await prisma.transaction.count()}`)
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
