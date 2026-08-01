import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  log: ['error'],
})

// Better categorization based on product name + brand name
function determineCorrectCategory(productName: string, brandName: string): { name: string; slug: string; icon: string } {
  const combined = `${productName} ${brandName}`.toLowerCase()
  
  // RELOJES (watches - very specific, check first)
  if (combined.includes('watch') || combined.includes('reloj') || combined.includes('⌚') || 
      combined.includes('rolex') || combined.includes('casio') || combined.includes('omega') ||
      combined.includes('patek') || combined.includes('audemars') ||
      combined.includes('richard mille') || combined.includes('vacheron') || combined.includes('longines') ||
      combined.includes('g-shock')) {
    return { name: 'Relojes', slug: 'relojes', icon: '⌚' }
  }
  
  // JOYERÍA (jewelry only - very specific, check for word boundaries)
  // Must NOT include soccer/sports terms
  if (!combined.includes('soccer') && !combined.includes('football') && !combined.includes('training') && !combined.includes('jersey') && !combined.includes('uniform') &&
      (combined.includes('jewelry') || combined.includes('jewel') || combined.includes('💎') ||
      /\bring\b/.test(combined) || combined.includes('anillo') || 
      (combined.includes('necklace') && !combined.includes('bag')) || 
      combined.includes('earring') || combined.includes('diamond') || 
      (combined.includes('gold chain') && !combined.includes('bag')))) {
    return { name: 'Joyería', slug: 'joyeria', icon: '💎' }
  }
  
  // JERSEYS (check before Bolsos - soccer jerseys often have no "bag" keyword)
  if (combined.includes('jersey') || combined.includes('football shirt') || 
      combined.includes('soccer') || combined.includes('nba') || combined.includes('nfl') || 
      combined.includes('ncaa') || combined.includes('⚽') || combined.includes('🏀') || 
      combined.includes('maillot') || combined.includes('player version') ||
      combined.includes('training kit') || combined.includes('soccer uniform')) {
    return { name: 'Jerseys', slug: 'jerseys', icon: '⚽' }
  }
  
  // BOLSOS (check before Gafas - "hourglass" is a bag, not glasses)
  if (combined.includes('bag') || combined.includes('bols') || combined.includes('tote') || 
      combined.includes('wallet') || combined.includes('cartera') || combined.includes('handbag') ||
      combined.includes('shoulder bag') || combined.includes('crossbody') || combined.includes('👜') ||
      combined.includes('clutch') || combined.includes('backpack') || combined.includes('mochila') ||
      combined.includes('purse') || combined.includes('pouch') || combined.includes('hourglass')) {
    return { name: 'Bolsos', slug: 'bolsos', icon: '👜' }
  }
  
  // GAFAS (sunglasses, eyeglasses) - check after bags
  if (combined.includes('glass') || combined.includes('gafa') || combined.includes('👓') ||
      combined.includes('sunglass') || combined.includes('lentes')) {
    return { name: 'Gafas', slug: 'gafas', icon: '👓' }
  }
  
  // CALZADO (shoes - the key fix)
  if (combined.includes('shoe') || combined.includes('zapato') || combined.includes('sneaker') ||
      combined.includes('slipper') || combined.includes('sandal') || combined.includes('boot') ||
      combined.includes('👟') || combined.includes('👠') || combined.includes('👢') ||
      combined.includes('tenis') || combined.includes('loafer') || combined.includes('heel') ||
      combined.includes('louboutin') || combined.includes('sneakers') ||
      combined.includes('air force') || combined.includes('air jordan') || combined.includes('yeezy')) {
    return { name: 'Calzado', slug: 'calzado', icon: '👟' }
  }
  
  // CINTURONES (belts - after bags and shoes)
  if (combined.includes('belt') || combined.includes('cinturón') || combined.includes('cinturon') || combined.includes('🎗')) {
    return { name: 'Cinturones', slug: 'cinturones', icon: '🎗' }
  }
  
  // ROPA DE DAMA
  if ((combined.includes('ladies') || combined.includes('women cloth') || combined.includes('women wear') ||
      combined.includes('dama') || combined.includes('👚') || combined.includes('👗') ||
      combined.includes('max mara')) && !combined.includes('shoe') && !combined.includes('bag')) {
    return { name: 'Ropa de Dama', slug: 'ropa-dama', icon: '👚' }
  }
  
  // ROPA
  if (combined.includes('jacket') || combined.includes('coat') || combined.includes('cloth') ||
      combined.includes('shirt') || combined.includes('pant') || combined.includes('hoodie') ||
      combined.includes('sweater') || combined.includes('tee') || combined.includes('🧥') ||
      combined.includes('👕') || combined.includes('👖') || combined.includes('dress') ||
      combined.includes('vest') || combined.includes('skirt') || combined.includes('short') ||
      combined.includes('suit') || combined.includes('blazer') || combined.includes('tracksuit') ||
      combined.includes('down jacket') || combined.includes('tshirt') || combined.includes('t-shirt') ||
      combined.includes('sweatshirt') || combined.includes('pants')) {
    return { name: 'Ropa', slug: 'ropa', icon: '🧥' }
  }
  
  // GORRAS
  if (combined.includes('cap') || combined.includes('gorra') || combined.includes('🎓') || combined.includes('hat')) {
    return { name: 'Gorras', slug: 'gorras', icon: '🎓' }
  }
  
  // BUFANDAS
  if (combined.includes('scarf') || combined.includes('bufanda') || combined.includes('🧣')) {
    return { name: 'Bufandas', slug: 'bufandas', icon: '🧣' }
  }
  
  // CALCETINES
  if (combined.includes('sock') || combined.includes('calcetín') || combined.includes('🧦')) {
    return { name: 'Calcetines', slug: 'calcetines', icon: '🧦' }
  }
  
  // TRAJES DE BAÑO
  if (combined.includes('swim') || combined.includes('bikini') || combined.includes('👙')) {
    return { name: 'Trajes de baño', slug: 'trajes-bano', icon: '👙' }
  }
  
  // ELECTRÓNICA
  if (combined.includes('headphone') || combined.includes('earphone') || combined.includes('🎧') ||
      combined.includes('airpod') || combined.includes('speaker') || combined.includes('altavoz') ||
      combined.includes('beats studio')) {
    return { name: 'Electrónica', slug: 'electronica', icon: '🎧' }
  }
  
  return { name: 'Moda', slug: 'moda', icon: '👗' }
}

async function main() {
  console.log('🔧 Re-categorizando con SQL directo...\n', new Date().toISOString())

  // Create all categories
  const categoryDefs = [
    { name: 'Relojes', slug: 'relojes', icon: '⌚' },
    { name: 'Joyería', slug: 'joyeria', icon: '💎' },
    { name: 'Gafas', slug: 'gafas', icon: '👓' },
    { name: 'Cinturones', slug: 'cinturones', icon: '🎗' },
    { name: 'Bolsos', slug: 'bolsos', icon: '👜' },
    { name: 'Calzado', slug: 'calzado', icon: '👟' },
    { name: 'Jerseys', slug: 'jerseys', icon: '⚽' },
    { name: 'Ropa de Dama', slug: 'ropa-dama', icon: '👚' },
    { name: 'Ropa', slug: 'ropa', icon: '🧥' },
    { name: 'Gorras', slug: 'gorras', icon: '🎓' },
    { name: 'Bufandas', slug: 'bufandas', icon: '🧣' },
    { name: 'Calcetines', slug: 'calcetines', icon: '🧦' },
    { name: 'Trajes de baño', slug: 'trajes-bano', icon: '👙' },
    { name: 'Electrónica', slug: 'electronica', icon: '🎧' },
    { name: 'Moda', slug: 'moda', icon: '👗' },
  ]
  
  const catMap = new Map<string, string>()
  for (const cat of categoryDefs) {
    let category = await prisma.category.findFirst({ where: { slug: cat.slug } })
    if (!category) {
      category = await prisma.category.create({ data: cat })
    }
    catMap.set(cat.slug, category.id)
    console.log(`  ${cat.icon} ${cat.name}: ${category.id}`)
  }

  // Load all products with brand info
  console.log('\nCargando productos...')
  const products = await prisma.product.findMany({
    select: { id: true, name: true, categoryId: true, brand: { select: { name: true } } },
  })
  console.log(`${products.length} productos cargados`)

  // Group products by target category for bulk update
  const productsByCategory = new Map<string, string[]>()
  
  for (const p of products) {
    const brandName = p.brand?.name || ''
    const correctCat = determineCorrectCategory(p.name, brandName)
    const correctCatId = catMap.get(correctCat.slug)!
    
    if (correctCatId !== p.categoryId) {
      if (!productsByCategory.has(correctCatId)) {
        productsByCategory.set(correctCatId, [])
      }
      productsByCategory.get(correctCatId)!.push(p.id)
    }
  }

  // Bulk update using SQL (much faster than individual updates)
  let totalUpdated = 0
  for (const [catId, productIds] of productsByCategory) {
    // Update in chunks of 500
    for (let i = 0; i < productIds.length; i += 500) {
      const chunk = productIds.slice(i, i + 500)
      const placeholders = chunk.map((_, idx) => `$${idx + 2}`).join(',')
      const result = await prisma.$executeRawUnsafe(
        `UPDATE products SET category_id = $1 WHERE id IN (${placeholders})`,
        catId,
        ...chunk
      )
      totalUpdated += result
    }
    const cat = categoryDefs.find(c => catMap.get(c.slug) === catId)
    console.log(`  ${cat?.icon} ${cat?.name}: ${productIds.length} productos actualizados`)
  }

  console.log(`\n=== DONE: ${totalUpdated} productos re-categorizados ===`)
  console.log(new Date().toISOString())

  // Show distribution
  console.log('\n=== DISTRIBUCIÓN FINAL ===')
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  })
  for (const c of categories) {
    if (c._count.products > 0) {
      console.log(`  ${c.icon} ${c.name}: ${c._count.products} productos`)
    }
  }
  
  // Show samples
  console.log('\n=== MUESTRAS POR CATEGORÍA ===')
  for (const c of categories) {
    if (c._count.products === 0) continue
    const samples = await prisma.product.findMany({
      where: { categoryId: c.id },
      select: { name: true, brand: { select: { name: true } } },
      take: 3,
    })
    console.log(`\n${c.icon} ${c.name} (${c._count.products}):`)
    for (const s of samples) {
      console.log(`  [${s.brand?.name}] ${s.name.substring(0, 50)}`)
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
