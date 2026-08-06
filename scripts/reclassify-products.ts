/**
 * NEXORA — Re-clasificar productos: mover "wallets/carteras" de Bolsos → Carteras
 *
 * Problema: el mapeo regex original atrapaba "wallet" en la regla de "bolsos",
 * así que TODOS los productos tipo Wallet/Cartera terminaron en categoría "Bolsos".
 *
 * Solución:
 *   1. Lee todos los productos
 *   2. Para cada uno, detecta la categoría correcta por nombre
 *   3. Actualiza los que están mal clasificados
 *   4. Reporta conteos antes/después
 */
import { db } from '../src/lib/db'

async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  NEXORA — Re-clasificación de productos (Bolsos → Carteras)')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')

  // 1. Cargar categorías por slug
  const cats = await db.category.findMany()
  const catBySlug = new Map(cats.map(c => [c.slug, c]))
  const carteras = catBySlug.get('carteras')!
  const cinturones = catBySlug.get('cinturones')!
  const relojes = catBySlug.get('relojes')!
  const gafas = catBySlug.get('gafas')!
  const calzado = catBySlug.get('calzado')!
  const ropa = catBySlug.get('ropa')!
  const bolsos = catBySlug.get('bolsos')!

  // 2. Conteos ANTES
  const before = await db.product.groupBy({
    by: ['categoryId'],
    _count: true,
  })
  console.log('📊 CONTEOS ANTES:')
  for (const r of before) {
    const cat = cats.find(c => c.id === r.categoryId)
    console.log(`   ${(cat?.name || '?').padEnd(25)} ${r._count}`)
  }
  console.log('')

  // 3. Función para detectar categoría correcta por nombre
  function detectCorrectCategory(name: string): string | null {
    const n = name.toLowerCase()
    // Carteras / Wallets — PRIORIDAD ALTA (más específico que "bag")
    if (/wallet|cartera|carteras|long\s*wallet|card\s*case|zip\s*wallet|pocket\s*wallet/i.test(n)) {
      return carteras.id
    }
    // Cinturones
    if (/belt|cintur|cintr/i.test(n)) {
      return cinturones.id
    }
    // Relojes
    if (/watch|reloj|rolex|audemars|patek|vacheron|cartier\s+watch|omega\s+watch|longines|casio|g.?shock|richard\s*mille/i.test(n)) {
      return relojes.id
    }
    // Gafas
    if (/glass|gafa|sunglass|eyewear|eyeglass/i.test(n)) {
      return gafas.id
    }
    // Calzado
    if (/shoe|sneaker|slipper|boot|zapato|sandal|heel|sneakers/i.test(n)) {
      return calzado.id
    }
    // Ropa
    if (/shirt|tee|hoodie|pant|short|jacket|cloth|jean|sweat|tracksuit|biker|ladies|dress/i.test(n)) {
      return ropa.id
    }
    // Si solo dice "bag" o "handbag" → se queda en bolsos
    return null // no cambiar
  }

  // 4. Cargar todos los productos
  const allProducts = await db.product.findMany({
    select: { id: true, name: true, categoryId: true },
    take: 200000,
  })
  console.log(`📦 Analizando ${allProducts.length} productos...`)

  // 5. Detectar movimientos necesarios
  const moves: Array<{ id: string; fromCat: string; toCat: string; name: string }> = []
  for (const p of allProducts) {
    const correctCat = detectCorrectCategory(p.name)
    if (correctCat && correctCat !== p.categoryId) {
      moves.push({
        id: p.id,
        fromCat: p.categoryId,
        toCat: correctCat,
        name: p.name,
      })
    }
  }

  console.log(`\n🔄 ${moves.length} productos necesitan re-clasificación`)
  console.log('')

  // 6. Agrupar movimientos por categoría destino
  const movesByDest = new Map<string, number>()
  for (const m of moves) {
    movesByDest.set(m.toCat, (movesByDest.get(m.toCat) || 0) + 1)
  }
  console.log('📋 Movimientos por categoría destino:')
  for (const [catId, count] of movesByDest) {
    const cat = cats.find(c => c.id === catId)
    console.log(`   → ${(cat?.name || '?').padEnd(25)} +${count}`)
  }
  console.log('')

  // 7. Ejecutar movimientos en lotes de 500
  const BATCH = 500
  let updated = 0
  for (let i = 0; i < moves.length; i += BATCH) {
    const batch = moves.slice(i, i + BATCH)
    // Agrupar por categoría destino para hacer updates eficientes
    const byDest = new Map<string, string[]>()
    for (const m of batch) {
      if (!byDest.has(m.toCat)) byDest.set(m.toCat, [])
      byDest.get(m.toCat)!.push(m.id)
    }
    for (const [catId, ids] of byDest) {
      const r = await db.product.updateMany({
        where: { id: { in: ids } },
        data: { categoryId: catId },
      })
      updated += r.count
    }
    process.stdout.write(`\r   Progreso: ${Math.min(i + BATCH, moves.length)}/${moves.length}`)
  }
  console.log('')
  console.log(`   ✓ ${updated} productos actualizados`)

  // 8. Conteos DESPUÉS
  const after = await db.product.groupBy({
    by: ['categoryId'],
    _count: true,
    orderBy: { _count: { categoryId: 'desc' } },
  })
  console.log('\n📊 CONTEOS DESPUÉS:')
  for (const r of after) {
    const cat = cats.find(c => c.id === r.categoryId)
    console.log(`   ${(cat?.name || '?').padEnd(25)} ${r._count}`)
  }
  console.log('')

  // 9. Top muestra de productos por categoría para verificar
  console.log('🔍 Muestra de productos por categoría:')
  for (const r of after) {
    const cat = cats.find(c => c.id === r.categoryId)
    const sample = await db.product.findFirst({
      where: { categoryId: r.categoryId },
      select: { name: true, sku: true },
    })
    console.log(`   ${cat?.name?.padEnd(25)} ${String(r._count).padStart(6)}  ej: ${sample?.name?.substring(0, 50) || 'N/A'}`)
  }
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('✅ Re-clasificación completada')
  console.log('═══════════════════════════════════════════════════════════════')
}

main()
  .catch(e => { console.error('❌ Fatal:', e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
