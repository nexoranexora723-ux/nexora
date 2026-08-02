import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
  const email = 'nexoranexora723@gmail.com'
  const password = 'N3x0r@2025!C0l'
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10)
  
  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    // Update to ADMIN with new password
    const updated = await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        firstName: 'NEXORA',
        lastName: 'Admin',
      },
    })
    console.log(`✅ Usuario actualizado: ${updated.email} | Rol: ${updated.role}`)
  } else {
    // Find the company
    const company = await prisma.company.findFirst()
    if (!company) {
      console.log('❌ No hay empresa creada')
      return
    }
    
    // Create new admin user
    const newUser = await prisma.user.create({
      data: {
        firstName: 'NEXORA',
        lastName: 'Admin',
        email,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        companyId: company.id,
        phone: '+57 310 555 0100',
      },
    })
    console.log(`✅ Nuevo admin creado: ${newUser.email} | Rol: ${newUser.role}`)
  }
  
  // Verify
  const user = await prisma.user.findUnique({ where: { email } })
  console.log(`\n=== CUENTA DE ADMIN ===`)
  console.log(`  Email: ${user?.email}`)
  console.log(`  Nombre: ${user?.firstName} ${user?.lastName}`)
  console.log(`  Rol: ${user?.role}`)
  console.log(`  Estado: ${user?.status}`)
  console.log(`  Contraseña: ${password}`)
  console.log(`\n⚠️ Guarda esta contraseña en un lugar seguro.`)
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
