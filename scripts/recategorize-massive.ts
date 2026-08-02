import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

function determineCategory(productName: string, brandName: string): { name: string; slug: string; icon: string } {
  const combined = `${productName} ${brandName}`.toLowerCase()
  
  // RELOJES (watches)
  if (combined.includes('watch') || combined.includes('reloj') || combined.includes('⌚') || 
      combined.includes('rolex') || combined.includes('casio') || combined.includes('omega') ||
      combined.includes('patek') || combined.includes('audemars') ||
      combined.includes('richard mille') || combined.includes('vacheron') || combined.includes('longines') ||
      combined.includes('g-shock') || combined.includes('mi band') || combined.includes('smartwatch') ||
      combined.includes('apple watch')) {
    return { name: 'Relojes', slug: 'relojes', icon: '⌚' }
  }
  
  // JOYERÍA (jewelry)
  if (!combined.includes('soccer') && !combined.includes('football') && !combined.includes('training') && 
      !combined.includes('jersey') && !combined.includes('uniform') &&
      (combined.includes('jewelry') || combined.includes('jewel') || combined.includes('💎') ||
      /\bring\b/.test(combined) || combined.includes('anillo') || 
      (combined.includes('necklace') && !combined.includes('bag')) || 
      combined.includes('earring') || combined.includes('diamond') || 
      (combined.includes('gold chain') && !combined.includes('bag')))) {
    return { name: 'Joyería', slug: 'joyeria', icon: '💎' }
  }
  
  // JERSEYS (soccer/basketball jerseys)
  if (combined.includes('jersey') || combined.includes('football shirt') || 
      combined.includes('soccer') || combined.includes('nba') || combined.includes('nfl') || 
      combined.includes('ncaa') || combined.includes('⚽') || combined.includes('🏀') || 
      combined.includes('maillot') || combined.includes('player version') ||
      combined.includes('training kit') || combined.includes('soccer uniform') ||
      combined.includes('training suit') || combined.includes('camisas de time') ||
      combined.includes('home field') || combined.includes('away soccer') ||
      combined.includes('special edition soccer') || combined.includes('palmeiras') ||
      combined.includes('flamengo') || combined.includes('brazil') && combined.includes('soccer') ||
      combined.includes('cape verde') && combined.includes('home')) {
    return { name: 'Jerseys', slug: 'jerseys', icon: '⚽' }
  }
  
  // BOLSOS
  if (combined.includes('bag') || combined.includes('bols') || combined.includes('tote') || 
      combined.includes('wallet') || combined.includes('cartera') || combined.includes('handbag') ||
      combined.includes('shoulder bag') || combined.includes('crossbody') || combined.includes('👜') ||
      combined.includes('clutch') || combined.includes('backpack') || combined.includes('mochila') ||
      combined.includes('purse') || combined.includes('pouch') || combined.includes('hourglass') ||
      combined.includes('handbag') || combined.includes('keepall') || combined.includes('trunk') ||
      combined.includes('drawstring') || combined.includes('carryall')) {
    return { name: 'Bolsos', slug: 'bolsos', icon: '👜' }
  }
  
  // GAFAS
  if (combined.includes('sunglass') || combined.includes('glass') && !combined.includes('bag') || 
      combined.includes('gafa') || combined.includes('👓') || combined.includes('lentes')) {
    return { name: 'Gafas', slug: 'gafas', icon: '👓' }
  }
  
  // CALZADO
  if (combined.includes('shoe') || combined.includes('zapato') || combined.includes('sneaker') ||
      combined.includes('slipper') || combined.includes('sandal') || combined.includes('boot') ||
      combined.includes('👟') || combined.includes('👠') || combined.includes('👢') ||
      combined.includes('tenis') || combined.includes('loafer') || combined.includes('heel') ||
      combined.includes('louboutin') || combined.includes('sneakers') ||
      combined.includes('air force') || combined.includes('air jordan') || combined.includes('yeezy') ||
      combined.includes('loafers')) {
    return { name: 'Calzado', slug: 'calzado', icon: '👟' }
  }
  
  // CINTURONES
  if (combined.includes('belt') || combined.includes('cinturón') || combined.includes('cinturon') || combined.includes('🎗')) {
    return { name: 'Cinturones', slug: 'cinturones', icon: '🎗' }
  }
  
  // GORRAS
  if (combined.includes('cap') && !combined.includes('cape verde') || combined.includes('gorra') || 
      combined.includes('🎓') || combined.includes('hat') && !combined.includes('watch')) {
    return { name: 'Gorras', slug: 'gorras', icon: '🎓' }
  }
  
  // BUFANDAS
  if (combined.includes('scarf') || combined.includes('bufanda') || combined.includes('🧣') || combined.includes('blanket')) {
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
      combined.includes('beats studio') || combined.includes('earbuds') || combined.includes('led') ||
      combined.includes('drone') || combined.includes('dron') || combined.includes('smartwatch') ||
      combined.includes('mi band') || combined.includes('tablet') || combined.includes('galaxy tab') ||
      combined.includes('lámpara') || combined.includes('lampara') || combined.includes('humidificador') ||
      combined.includes('brochas') || combined.includes('maquillaje') || combined.includes('facial') ||
      combined.includes('soporte') || combined.includes('case lot') || combined.includes('funda')) {
    return { name: 'Electrónica', slug: 'electronica', icon: '🎧' }
  }
  
  // ROPA DE DAMA
  if ((combined.includes('ladies') || combined.includes('women cloth') || combined.includes('women wear') ||
      combined.includes('dama') || combined.includes('👚') || combined.includes('👗') ||
      combined.includes('ladies cloth') || combined.includes('ladies wear') ||
      combined.includes('women clothing') || combined.includes('women clothes') ||
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
      combined.includes('sweatshirt') || combined.includes('pants') || combined.includes('polo') ||
      combined.includes('best sellers') || combined.includes('top version') || combined.includes('top quality')) {
    return { name: 'Ropa', slug: 'ropa', icon: '🧥' }
  }
  
  return { name: 'Moda', slug: 'moda', icon: '👗' }
}

async function main() {
  console.log('🔧 Re-categorización masiva mejorada...\n')
  
  const categoryDefs = [
    { name: 'Relojes', slug: 'relojes', icon: '⌚' },
    { name: 'Joyería', slug: 'joyeria', icon: '💎' },
    { name: 'Jerseys', slug: 'jerseys', icon: '⚽' },
    { name: 'Bolsos', slug: 'bolsos', icon: '👜' },
    { name: 'Gafas', slug: 'gafas', icon: '👓' },
    { name: 'Calzado', slug: 'calzado', icon: '👟' },
    { name: 'Cinturones', slug: 'cinturones', icon: '🎗' },
    { name: 'Gorras', slug: 'gorras', icon: '🎓' },
    { name: 'Bufandas', slug: 'bufandas', icon: '🧣' },
    { name: 'Calcetines', slug: 'calcetines', icon: '🧦' },
    { name: 'Trajes de baño', slug: 'trajes-bano', icon: '👙' },
    { name: 'Electrónica', slug: 'electronica', icon: '🎧' },
    { name: 'Ropa de Dama', slug: 'ropa-dama', icon: '👚' },
    { name: 'Ropa', slug: 'ropa', icon: '🧥' },
    { name: 'Moda', slug: 'moda', icon: '👗' },
  ]
  
  const catMap = new Map<string, string>()
  for (const cat of categoryDefs) {
    let category = await prisma.category.findFirst({ where: { slug: cat.slug } })
    if (!category) {
      category = await prisma.category.create({ data: cat })
    }
    catMap.set(cat.slug, category.id)
  }
  
  const products = await prisma.product.findMany({
    select: { id: true, name: true, categoryId: true, brand: { select: { name: true } } },
  })
  console.log(`Total productos: ${products.length}`)
  
  const productsByCategory = new Map<string, string[]>()
  let changed = 0
  let unchanged = 0
  
  for (const p of products) {
    const brandName = p.brand?.name || ''
    const correctCat = determineCategory(p.name, brandName)
    const correctCatId = catMap.get(correctCat.slug)!
    
    if (correctCatId !== p.categoryId) {
      if (!productsByCategory.has(correctCatId)) {
        productsByCategory.set(correctCatId, [])
      }
      productsByCategory.get(correctCatId)!.push(p.id)
      changed++
    } else {
      unchanged++
    }
  }
  
  console.log(`\nProductos a mover: ${changed}`)
  console.log(`Productos sin cambios: ${unchanged}`)
  
  // Bulk update using SQL
  let totalUpdated = 0
  for (const [catId, productIds] of productsByCategory) {
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
  
  console.log(`\n=== TOTAL: ${totalUpdated} productos re-categorizados ===`)
  
  // Show final distribution
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
  
  // Show samples per category to verify
  console.log('\n=== MUESTRAS FINALES ===')
  for (const c of categories) {
    if (c._count.products === 0) continue
    const samples = await prisma.product.findMany({
      where: { categoryId: c.id },
      select: { name: true, brand: { select: { name: true } } },
      take: 5,
    })
    console.log(`\n${c.icon} ${c.name} (${c._count.products}):`)
    for (const s of samples) {
      console.log(`  [${s.brand?.name}] ${s.name.substring(0, 55)}`)
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
