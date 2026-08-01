import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true },
  })
  console.log('=== USUARIOS EN LA BD ===')
  for (const u of users) {
    console.log(`  ${u.firstName} ${u.lastName} | ${u.email} | role: ${u.role} | status: ${u.status}`)
  }
}
main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
