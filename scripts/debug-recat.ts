import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

function determineCorrectCategory(productName: string, brandName: string): { name: string; slug: string; icon: string } {
  const combined = `${productName} ${brandName}`.toLowerCase()
  
  // RELOJES
  if (combined.includes('watch') || combined.includes('reloj') || combined.includes('⌚') || 
      combined.includes('rolex') || combined.includes('casio') || combined.includes('omega') ||
      combined.includes('patek') || combined.includes('audemars') ||
      combined.includes('richard mille') || combined.includes('vacheron') || combined.includes('longines') ||
      combined.includes('g-shock')) {
    return { name: 'Relojes', slug: 'relojes', icon: '⌚' }
  }
  
  // JOYERÍA
  if (!combined.includes('soccer') && !combined.includes('football') && !combined.includes('training') && !combined.includes('jersey') && !combined.includes('uniform') &&
      (combined.includes('jewelry') || combined.includes('jewel') || combined.includes('💎') ||
      /\bring\b/.test(combined) || combined.includes('anillo') || 
      (combined.includes('necklace') && !combined.includes('bag')) || 
      combined.includes('earring') || combined.includes('diamond') || 
      (combined.includes('gold chain') && !combined.includes('bag')))) {
    return { name: 'Joyería', slug: 'joyeria', icon: '💎' }
  }
  
  // JERSEYS
  if (combined.includes('jersey') || combined.includes('football shirt') || 
      combined.includes('soccer') || combined.includes('nba') || combined.includes('nfl') || 
      combined.includes('ncaa') || combined.includes('⚽') || combined.includes('🏀') || 
      combined.includes('maillot') || combined.includes('player version') ||
      combined.includes('training kit') || combined.includes('soccer uniform')) {
    return { name: 'Jerseys', slug: 'jerseys', icon: '⚽' }
  }
  
  // BOLSOS
  if (combined.includes('bag') || combined.includes('bols') || combined.includes('tote') || 
      combined.includes('wallet') || combined.includes('cartera') || combined.includes('handbag') ||
      combined.includes('shoulder bag') || combined.includes('crossbody') || combined.includes('👜') ||
      combined.includes('clutch') || combined.includes('backpack') || combined.includes('mochila') ||
      combined.includes('purse') || combined.includes('pouch') || combined.includes('hourglass')) {
    return { name: 'Bolsos', slug: 'bolsos', icon: '👜' }
  }
  
  // GAFAS
  if (combined.includes('glass') || combined.includes('gafa') || combined.includes('👓') ||
      combined.includes('sunglass') || combined.includes('lentes')) {
    return { name: 'Gafas', slug: 'gafas', icon: '👓' }
  }
  
  // CALZADO
  if (combined.includes('shoe') || combined.includes('zapato') || combined.includes('sneaker') ||
      combined.includes('slipper') || combined.includes('sandal') || combined.includes('boot') ||
      combined.includes('👟') || combined.includes('👠') || combined.includes('👢') ||
      combined.includes('tenis') || combined.includes('loafer') || combined.includes('heel') ||
      combined.includes('louboutin') || combined.includes('sneakers') ||
      combined.includes('air force') || combined.includes('air jordan') || combined.includes('yeezy')) {
    return { name: 'Calzado', slug: 'calzado', icon: '👟' }
  }
  
  // CINTURONES
  if (combined.includes('belt') || combined.includes('cinturón') || combined.includes('cinturon') || combined.includes('🎗')) {
    return { name: 'Cinturones', slug: 'cinturones', icon: '🎗' }
  }
  
  return { name: 'Moda', slug: 'moda', icon: '👗' }
}

async function main() {
  // Check Bottega Veneta BAG products
  const bvProducts = await prisma.product.findMany({
    where: { name: { contains: 'Bottegass' } },
    select: { id: true, name: true, brand: { select: { name: true } }, category: { select: { name: true } } },
    take: 3,
  })
  
  for (const p of bvProducts) {
    const brandName = p.brand?.name || ''
    const correct = determineCorrectCategory(p.name, brandName)
    console.log(`Name: ${p.name}`)
    console.log(`  Current: ${p.category?.name} → Should be: ${correct.name}`)
    console.log(`  Match: ${p.category?.name === correct.name}`)
  }
}
main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
