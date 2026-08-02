import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const p = await prisma.product.findFirst({
    where: { sku: 'YP-182425674' },
    select: { name: true, specs: true },
  })
  console.log('Product:', p?.name)
  console.log('Specs:', p?.specs)
  if (p?.specs) {
    const specs = JSON.parse(p.specs)
    console.log('Parsed specs:', JSON.stringify(specs, indent=2, ensure_ascii=False))
  }
}
main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
