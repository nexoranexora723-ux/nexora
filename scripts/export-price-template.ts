import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'
const prisma = new PrismaClient()

async function main() {
  console.log('📄 Generando plantilla CSV de precios...')
  
  // Get all products with their current prices
  const products = await prisma.product.findMany({
    select: {
      sku: true,
      name: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
      estimatedCost: true, // Precio final actual
      suggestedPrice: true, // Costo total actual
    },
    orderBy: { brand: { name: 'asc' } },
  })
  
  // Create CSV with columns: SKU, Nombre, Marca, Categoría, Precio Actual, Nuevo Precio
  let csv = 'SKU,Nombre,Marca,Categoria,Precio_Actual_USD,Nuevo_Precio_USD\n'
  
  for (const p of products) {
    const name = p.name.replace(/"/g, '""').replace(/,/g, ';')
    const brand = p.brand?.name || 'Varios'
    const cat = p.category?.name || 'Moda'
    const currentPrice = p.estimatedCost?.toFixed(2) || ''
    csv += `${p.sku},"${name}",${brand},${cat},${currentPrice},\n`
  }
  
  writeFileSync('public/price-template.csv', csv)
  console.log(`✓ Plantilla CSV generada: ${products.length} productos`)
  console.log(`📁 Archivo: public/price-template.csv`)
  console.log(`\n📋 Instrucciones:`)
  console.log(`1. Descarga el archivo desde: https://nexora-inky-mu.vercel.app/price-template.csv`)
  console.log(`2. Ábrelo en Excel o Google Sheets`)
  console.log(`3. Llena la columna "Nuevo_Precio_USD" con los precios reales`)
  console.log(`4. Guárdalo como CSV`)
  console.log(`5. Súbelo en el Admin → Editor de precios → Upload CSV`)
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)))
