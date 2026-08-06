import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Limpiando datos simulados...\n')
  
  // Count before
  const before = {
    requests: await prisma.importRequest.count(),
    quotes: await prisma.quote.count(),
    imports: await prisma.import.count(),
    transactions: await prisma.transaction.count(),
    notifications: await prisma.notification.count(),
    naiosRecs: await prisma.naiosRecommendation.count(),
    naiosConvos: await prisma.naiosConversation.count(),
    statusHistory: await prisma.requestStatusHistory.count(),
    auditLogs: await prisma.auditLog.count(),
    sessions: await prisma.session.count(),
  }
  
  console.log('=== ANTES ===')
  for (const [k, v] of Object.entries(before)) {
    console.log(`  ${k}: ${v}`)
  }
  
  // Delete in order (respecting foreign keys)
  const deleted = {
    naiosConversations: await prisma.naiosConversation.deleteMany({}),
    naiosRecommendations: await prisma.naiosRecommendation.deleteMany({}),
    notifications: await prisma.notification.deleteMany({}),
    transactions: await prisma.transaction.deleteMany({}),
    imports: await prisma.import.deleteMany({}),
    quotes: await prisma.quote.deleteMany({}),
    requestStatusHistory: await prisma.requestStatusHistory.deleteMany({}),
    requestAttachments: await prisma.requestAttachment.deleteMany({}),
    importRequests: await prisma.importRequest.deleteMany({}),
    auditLogs: await prisma.auditLog.deleteMany({}),
    sessions: await prisma.session.deleteMany({}),
  }
  
  console.log('\n=== ELIMINADOS ===')
  for (const [k, v] of Object.entries(deleted)) {
    console.log(`  ${k}: ${v.count}`)
  }
  
  // Count after
  console.log('\n=== DESPUÉS ===')
  const after = {
    requests: await prisma.importRequest.count(),
    quotes: await prisma.quote.count(),
    imports: await prisma.import.count(),
    transactions: await prisma.transaction.count(),
    notifications: await prisma.notification.count(),
    naiosRecs: await prisma.naiosRecommendation.count(),
    naiosConvos: await prisma.naiosConversation.count(),
    auditLogs: await prisma.auditLog.count(),
    sessions: await prisma.session.count(),
  }
  for (const [k, v] of Object.entries(after)) {
    console.log(`  ${k}: ${v}`)
  }
  
  // Keep: products, brands, categories, suppliers, users, company
  console.log('\n=== CONSERVADO (datos reales) ===')
  console.log(`  products: ${await prisma.product.count()}`)
  console.log(`  brands: ${await prisma.brand.count()}`)
  console.log(`  categories: ${await prisma.category.count()}`)
  console.log(`  suppliers: ${await prisma.supplier.count()}`)
  console.log(`  users: ${await prisma.user.count()}`)
  console.log(`  companies: ${await prisma.company.count()}`)
  console.log(`  supplierRatings: ${await prisma.supplierRating.count()}`)
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
