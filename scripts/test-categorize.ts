function determineCorrectCategory(productName: string, brandName: string): { name: string; slug: string } {
  const combined = `${productName} ${brandName}`.toLowerCase()
  
  // BOLSOS (check first - before anything else)
  if (combined.includes('bag') || combined.includes('bols') || combined.includes('tote') || 
      combined.includes('wallet') || combined.includes('cartera') || combined.includes('handbag') ||
      combined.includes('shoulder bag') || combined.includes('crossbody') || combined.includes('👜') ||
      combined.includes('clutch') || combined.includes('backpack') || combined.includes('mochila') ||
      combined.includes('purse') || combined.includes('pouch') || combined.includes('hourglass')) {
    return { name: 'Bolsos', slug: 'bolsos' }
  }
  
  return { name: 'Other', slug: 'other' }
}

const test = "Bottega Veneta Site Com Bottegass B0t﹡﹡g﹡ V﹡en﹡eta BAG"
console.log('Test:', test)
console.log('Combined:', test.toLowerCase())
console.log('Has "bag":', test.toLowerCase().includes('bag'))
console.log('Result:', determineCorrectCategory(test, 'Bottega Veneta'))
