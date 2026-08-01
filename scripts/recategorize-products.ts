import { db } from '../src/lib/db'

// Better categorization based on Yupoo's ACTUAL category name + product name
// This is much more accurate than the previous version

interface ProductInfo {
  sku: string
  name: string
  yupooCatName: string  // The original Yupoo category name (source of truth)
  albumTitle: string
}

function determineCorrectCategory(yupooCatName: string, albumTitle: string, productName: string): { name: string; slug: string; icon: string } {
  const combined = `${yupooCatName} ${albumTitle} ${productName}`.toLowerCase()
  
  // === RELOJES === (check first - watches are specific)
  if (combined.includes('watch') || combined.includes('reloj') || combined.includes('⌚') || 
      combined.includes('rolex') || combined.includes('casio') || combined.includes('omega') ||
      combined.includes('cartier watch') || combined.includes('patek') || combined.includes('audemars') ||
      combined.includes('richard mille') || combined.includes('vacheron') || combined.includes('longines') ||
      combined.includes('g-shock') || combined.includes('1:1 original quality') || combined.includes('top watches')) {
    return { name: 'Relojes', slug: 'relojes', icon: '⌚' }
  }
  
  // === JOYERÍA ===
  if (combined.includes('jewelry') || combined.includes('jewel') || combined.includes('💎') ||
      combined.includes('ring') || combined.includes('anillo') || combined.includes('necklace') ||
      combined.includes('collar de joya') || combined.includes('bracelet jewel') || combined.includes('pulsera de joya') ||
      combined.includes('earring') || combined.includes('pendiente de joya')) {
    return { name: 'Joyería', slug: 'joyeria', icon: '💎' }
  }
  
  // === GAFAS ===
  if (combined.includes('glass') || combined.includes('gafa') || combined.includes('👓') ||
      combined.includes('sunglass') || combined.includes('lentes')) {
    return { name: 'Gafas', slug: 'gafas', icon: '👓' }
  }
  
  // === CINTURONES ===
  if (combined.includes('belt') || combined.includes('cinturón') || combined.includes('cinturon') || 
      combined.includes('🎗')) {
    return { name: 'Cinturones', slug: 'cinturones', icon: '🎗' }
  }
  
  // === BOLSOS === (check before shoes - "bag" vs "shoe")
  if (combined.includes('bag') || combined.includes('bols') || combined.includes('tote') || 
      combined.includes('wallet') || combined.includes('cartera') || combined.includes('handbag') ||
      combined.includes('shoulder bag') || combined.includes('crossbody') || combined.includes('👜') ||
      combined.includes('clutch') || combined.includes('backpack') || combined.includes('mochila') ||
      combined.includes('purse') || combined.includes('pouch')) {
    return { name: 'Bolsos', slug: 'bolsos', icon: '👜' }
  }
  
  // === CALZADO === (shoes, sneakers, slippers, boots, sandals)
  if (combined.includes('shoe') || combined.includes('zapato') || combined.includes('sneaker') ||
      combined.includes('slipper') || combined.includes('sandal') || combined.includes('boot') ||
      combined.includes('👟') || combined.includes('👠') || combined.includes('👢') ||
      combined.includes('tenis') || combined.includes('loafer') || combined.includes('flat shoe') ||
      combined.includes('heel') || combined.includes('louboutin') || combined.includes('sneakers') ||
      combined.includes('ladies shoe') || combined.includes('men shoe') || combined.includes('men shoes') ||
      combined.includes('women shoe') || combined.includes('women shoes') || combined.includes('ladies shoes') ||
      combined.includes('football sneakers') || combined.includes('football shoe')) {
    return { name: 'Calzado', slug: 'calzado', icon: '👟' }
  }
  
  // === JERSEYS === (soccer/basketball jerseys)
  if (combined.includes('jersey') || combined.includes('football jersey') || combined.includes('soccer jersey') ||
      combined.includes('nba') || combined.includes('nfl') || combined.includes('ncaa') ||
      combined.includes('⚽') || combined.includes('🏀') || combined.includes('maillot') ||
      combined.includes('football shirt') || combined.includes('soccer uniform') ||
      combined.includes('player version')) {
    return { name: 'Jerseys', slug: 'jerseys', icon: '⚽' }
  }
  
  // === ROPA DE DAMA === (check before general clothes)
  if (combined.includes('ladies') || combined.includes('women cloth') || combined.includes('women wear') ||
      combined.includes('dama') || combined.includes('👚') || combined.includes('👗') ||
      combined.includes('ladies cloth') || combined.includes('ladies wear') || combined.includes('ladies shoe') === false && combined.includes('ladies') ||
      combined.includes('max mara') || combined.includes('ladies')) {
    // But not if it's shoes (already caught above)
    if (!combined.includes('shoe') && !combined.includes('sneaker')) {
      return { name: 'Ropa de Dama', slug: 'ropa-dama', icon: '👚' }
    }
  }
  
  // === ROPA === (general clothing)
  if (combined.includes('jacket') || combined.includes('coat') || combined.includes('cloth') ||
      combined.includes('shirt') || combined.includes('pant') || combined.includes('hoodie') ||
      combined.includes('sweater') || combined.includes('tee') || combined.includes('🧥') ||
      combined.includes('👕') || combined.includes('👖') || combined.includes('dress') ||
      combined.includes('vest') || combined.includes('skirt') || combined.includes('short') ||
      combined.includes('suit') || combined.includes('blazer') || combined.includes('tracksuit') ||
      combined.includes('down jacket') || combined.includes('biker jeans') ||
      combined.includes('tshirt') || combined.includes('t-shirt') || combined.includes('top version') === false && combined.includes('top') ||
      combined.includes('sweatshirt') || combined.includes('pants') || combined.includes('short')) {
    return { name: 'Ropa', slug: 'ropa', icon: '🧥' }
  }
  
  // === GORRAS ===
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
  console.log('🔧 Re-categorizando 64,325 productos...\n')

  // Load Yupoo categories mapping
  const yupooCats: { id: string; name: string }[] = JSON.parse(
    require('fs').readFileSync('/tmp/yupoo-categories.json', 'utf-8')
  )
  const yupooCatMap = new Map(yupooCats.map(c => [c.id, c.name]))

  // Load all albums with their Yupoo category IDs
  const albums: { id: string; title: string; categories: string[] }[] = JSON.parse(
    require('fs').readFileSync('/tmp/yupoo-all-albums-full.json', 'utf-8')
  )
  const albumMap = new Map(albums.map(a => [a.id, a]))

  const products = await db.product.findMany({
    where: { sku: { startsWith: 'YP-' } },
    select: { id: true, sku: true, name: true, categoryId: true, brandId: true },
  })
  console.log(`Total productos a procesar: ${products.length}`)

  // First, ensure all needed categories exist
  const categoryDefs = new Map<string, { name: string; slug: string; icon: string }>()
  for (const p of products) {
    const albumId = p.sku.replace('YP-', '')
    const album = albumMap.get(albumId)
    if (!album) continue
    const yupooCatName = album.categories.length > 0 
      ? (yupooCatMap.get(album.categories[0]) || '')
      : ''
    const cat = determineCorrectCategory(yupooCatName, album.title, p.name)
    categoryDefs.set(cat.slug, cat)
  }

  console.log(`\nCategorías necesarias: ${categoryDefs.size}`)
  for (const [, cat] of categoryDefs) {
    console.log(`  ${cat.icon} ${cat.name}`)
  }

  // Create or find categories
  const catMap = new Map<string, string>()
  for (const [slug, cat] of categoryDefs) {
    let category = await db.category.findFirst({ where: { slug } })
    if (!category) {
      category = await db.category.create({ data: { name: cat.name, slug: cat.slug, icon: cat.icon } })
    }
    catMap.set(slug, category.id)
  }

  // Update all products with correct category
  let updated = 0
  let unchanged = 0
  const BATCH = 500

  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH)
    const updates = []

    for (const p of batch) {
      const albumId = p.sku.replace('YP-', '')
      const album = albumMap.get(albumId)
      if (!album) {
        unchanged++
        continue
      }
      const yupooCatName = album.categories.length > 0 
        ? (yupooCatMap.get(album.categories[0]) || '')
        : ''
      const correctCat = determineCorrectCategory(yupooCatName, album.title, p.name)
      const correctCatId = catMap.get(correctCat.slug)
      
      if (correctCatId && correctCatId !== p.categoryId) {
        updates.push(
          db.product.update({
            where: { id: p.id },
            data: { categoryId: correctCatId },
          })
        )
        updated++
      } else {
        unchanged++
      }
    }

    if (updates.length > 0) await Promise.all(updates)

    if ((i + BATCH) % 10000 === 0 || i + BATCH >= products.length) {
      console.log(`  Procesados: ${Math.min(i + BATCH, products.length)}/${products.length} | Actualizados: ${updated} | Sin cambios: ${unchanged}`)
    }
  }

  console.log(`\n=== DONE ===`)
  console.log(`Productos re-categorizados: ${updated}`)
  console.log(`Sin cambios: ${unchanged}`)

  // Show category distribution
  console.log('\n=== DISTRIBUCIÓN POR CATEGORÍA ===')
  const categories = await db.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  })
  for (const c of categories) {
    console.log(`  ${c.icon} ${c.name}: ${c._count.products} productos`)
  }
}

main().catch(console.error).finally(() => process.exit(0))
