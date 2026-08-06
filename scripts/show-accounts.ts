import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const users = await prisma.user.findMany({
    select: { firstName: true, lastName: true, email: true, role: true, status: true },
    orderBy: { role: 'asc' },
  })
  console.log('=== CUENTAS DE USUARIO ===\n')
  for (const u of users) {
    console.log(`  ${u.role.padEnd(12)} | ${u.email.padEnd(30)} | ${u.firstName} ${u.lastName} | ${u.status}`)
  }
}
main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
