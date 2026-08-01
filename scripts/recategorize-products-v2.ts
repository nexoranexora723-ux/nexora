import { db } from '../src/lib/db'

// Re-categorize products based on product name + brand name
// This is the corrected version that properly categorizes shoes as Calzado, not Joyería

function determineCorrectCategory(productName: string, brandName: string, currentCatName: string): { name: string; slug: string; icon: string } {
  const combined = `${productName} ${brandName}`.toLowerCase()
  
  // === RELOJES === (watches - check first, very specific)
  if (combined.includes('watch') || combined.includes('reloj') || combined.includes('⌚') || 
      combined.includes('rolex') || combined.includes('casio') || combined.includes('omega') ||
      combined.includes('patek') || combined.includes('audemars') ||
      combined.includes('richard mille') || combined.includes('vacheron') || combined.includes('longines') ||
      combined.includes('g-shock') || combined.includes('cartier watch') ||
      // Watch brands that ONLY make watches
      (brandName === 'Cartier' && !combined.includes('bag') && !combined.includes('jewel'))) {
    return { name: 'Relojes', slug: 'relojes', icon: '⌚' }
  }
  
  // === JOYERÍA === (jewelry only - not watches, not bags)
  if (combined.includes('jewelry') || combined.includes('jewel') || combined.includes('💎') ||
      combined.includes('ring') || combined.includes('anillo') || combined.includes('necklace') ||
      combined.includes('collar de joya') || combined.includes('bracelet jewel') || 
      combined.includes('pulsera de joya') || combined.includes('earring') ||
      // Jewelry-specific terms
      combined.includes('gold chain') || combined.includes('silver chain') ||
      combined.includes('diamond') || combined.includes('gold ring')) {
    return { name: 'Joyería', slug: 'joyeria', icon: '💎' }
  }
  
  // === GAFAS === (sunglasses, eyeglasses)
  if (combined.includes('glass') || combined.includes('gafa') || combined.includes('👓') ||
      combined.includes('sunglass') || combined.includes('lentes')) {
    return { name: 'Gafas', slug: 'gafas', icon: '👓' }
  }
  
  // === CINTURONES === (belts)
  if (combined.includes('belt') || combined.includes('cinturón') || combined.includes('cinturon') || 
      combined.includes('🎗')) {
    return { name: 'Cinturones', slug: 'cinturones', icon: '🎗' }
  }
  
  // === BOLSOS === (bags, wallets, purses, backpacks)
  if (combined.includes('bag') || combined.includes('bols') || combined.includes('tote') || 
      combined.includes('wallet') || combined.includes('cartera') || combined.includes('handbag') ||
      combined.includes('shoulder bag') || combined.includes('crossbody') || combined.includes('👜') ||
      combined.includes('clutch') || combined.includes('backpack') || combined.includes('mochila') ||
      combined.includes('purse') || combined.includes('pouch')) {
    return { name: 'Bolsos', slug: 'bolsos', icon: '👜' }
  }
  
  // === CALZADO === (shoes, sneakers, slippers, boots, sandals, heels)
  // This is the key fix - shoes should be Calzado, NOT Joyería
  if (combined.includes('shoe') || combined.includes('zapato') || combined.includes('sneaker') ||
      combined.includes('slipper') || combined.includes('sandal') || combined.includes('boot') ||
      combined.includes('👟') || combined.includes('👠') || combined.includes('👢') ||
      combined.includes('tenis') || combined.includes('loafer') || combined.includes('flat') ||
      combined.includes('heel') || combined.includes('louboutin') ||
      // Shoe brand context
      (combined.includes('louboutin') && !combined.includes('bag')) ||
      combined.includes('men shoes') || combined.includes('women shoes') ||
      combined.includes('ladies shoes') || combined.includes('men shoe') ||
      combined.includes('women shoe') || combined.includes('ladies shoe') ||
      combined.includes('sneakers') || combined.includes('air force') ||
      combined.includes('air jordan') || combined.includes('yeezy')) {
    return { name: 'Calzado', slug: 'calzado', icon: '👟' }
  }
  
  // === JERSEYS === (soccer/basketball jerseys)
  if (combined.includes('jersey') || combined.includes('football shirt') || 
      combined.includes('soccer') || combined.includes('nba') || combined.includes('nfl') || 
      combined.includes('ncaa') || combined.includes('⚽') || combined.includes('🏀') || 
      combined.includes('maillot') || combined.includes('soccer uniform') ||
      combined.includes('player version') || combined.includes('football jersey')) {
    return { name: 'Jerseys', slug: 'jerseys', icon: '⚽' }
  }
  
  // === ROPA DE DAMA === (ladies clothing - check before general clothes)
  if ((combined.includes('ladies') || combined.includes('women cloth') || combined.includes('women wear') ||
      combined.includes('dama') || combined.includes('👚') || combined.includes('👗') ||
      combined.includes('ladies cloth') || combined.includes('ladies wear') ||
      combined.includes('max mara') || combined.includes('ladies')) &&
      !combined.includes('shoe') && !combined.includes('sneaker') && !combined.includes('bag')) {
    return { name: 'Ropa de Dama', slug: 'ropa-dama', icon: '👚' }
  }
  
  // === ROPA === (general clothing)
  if (combined.includes('jacket') || combined.includes('coat') || combined.includes('cloth') ||
      combined.includes('shirt') || combined.includes('pant') || combined.includes('hoodie') ||
      combined.includes('sweater') || combined.includes('tee') || combined.includes('🧥') ||
      combined.includes('👕') || combined.includes('👖') || combined.includes('dress') ||
      combined.includes('vest') || combined.includes('skirt') || combined.includes('short') ||
      combined.includes('suit') || combined.includes('blazer') || combined.includes('tracksuit') ||
      combined.includes('down jacket') || combined.includes('biker jeans') ||
      combined.includes('tshirt') || combined.includes('t-shirt') ||
      combined.includes('sweatshirt') || combined.includes('pants')) {
    return { name: 'Ropa', slug: 'ropa', icon: '🧥' }
  }
  
  // === GORRAS === (caps, hats)
  if (combined.includes('cap') || combined.includes('gorra') || combined.includes('🎓') ||
      combined.includes('hat')) {
    return { name: 'Gorras', slug: 'gorras', icon: '🎓' }
  }
  
  // === BUFANDAS ===
  if (combined.includes('scarf') || combined.includes('bufanda') || combined.includes('🧣')) {
    return { name: 'Bufandas', slug: 'bufandas', icon: '🧣' }
  }
  
  // === CALCETINES ===
  if (combined.includes('sock') || combined.includes('calcetín') || combined.includes('🧦')) {
    return { name: 'Calcetines', slug: 'calcetines', icon: '🧦' }
  }
  
  // === TRAJES DE BAÑO ===
  if (combined.includes('swim') || combined.includes('bikini') || combined.includes('👙')) {
    return { name: 'Trajes de baño', slug: 'trajes-bano', icon: '👙' }
  }
  
  // === ELECTRÓNICA ===
  if (combined.includes('headphone') || combined.includes('earphone') || combined.includes('🎧') ||
      combined.includes('airpod') || combined.includes('speaker') || combined.includes('altavoz') ||
      combined.includes('beats studio')) {
    return { name: 'Electrónica', slug: 'electronica', icon: '🎧' }
  }
  
  return { name: 'Moda', slug: 'moda', icon: '👗' }
}

async function main() {
  console.log('🔧 Re-categorizando 64,325 productos (versión corregida)...\n')

  const products = await db.product.findMany({
    select: { id: true, sku: true, name: true, categoryId: true, brand: { select: { name: true } }, category: { select: { name: true } } },
  })
  console.log(`Total productos: ${products.length}`)

  // Collect all needed categories
  const categoryDefs = new Map<string, { name: string; slug: string; icon: string }>()
  for (const p of products) {
    const brandName = p.brand?.name || ''
    const currentCatName = p.category?.name || ''
    const cat = determineCorrectCategory(p.name, brandName, currentCatName)
    categoryDefs.set(cat.slug, cat)
  }

  // Create categories
  const catMap = new Map<string, string>()
  for (const [slug, cat] of categoryDefs) {
    let category = await db.category.findFirst({ where: { slug } })
    if (!category) {
      category = await db.category.create({ data: { name: cat.name, slug: cat.slug, icon: cat.icon } })
    }
    catMap.set(slug, category.id)
  }

  // Update products (sequential to avoid connection pool exhaustion)
  let updated = 0
  let unchanged = 0
  const BATCH = 100

  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH)

    for (const p of batch) {
      const brandName = p.brand?.name || ''
      const currentCatName = p.category?.name || ''
      const correctCat = determineCorrectCategory(p.name, brandName, currentCatName)
      const correctCatId = catMap.get(correctCat.slug)
      
      if (correctCatId && correctCatId !== p.categoryId) {
        try {
          await db.product.update({
            where: { id: p.id },
            data: { categoryId: correctCatId },
          })
          updated++
        } catch {
          // ignore connection errors
        }
      } else {
        unchanged++
      }
    }

    if ((i + BATCH) % 5000 === 0 || i + BATCH >= products.length) {
      console.log(`  Procesados: ${Math.min(i + BATCH, products.length)}/${products.length} | Actualizados: ${updated} | Sin cambios: ${unchanged}`)
    }
  }

  console.log(`\n=== DONE ===`)
  console.log(`Re-categorizados: ${updated}`)
  console.log(`Sin cambios: ${unchanged}`)

  // Show distribution
  console.log('\n=== DISTRIBUCIÓN FINAL ===')
  const categories = await db.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  })
  for (const c of categories) {
    if (c._count.products > 0) {
      console.log(`  ${c.icon} ${c.name}: ${c._count.products} productos`)
    }
  }
  
  // Show samples per category to verify
  console.log('\n=== MUESTRAS POR CATEGORÍA ===')
  for (const c of categories) {
    if (c._count.products === 0) continue
    const samples = await db.product.findMany({
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

main().catch(console.error).finally(() => process.exit(0))
