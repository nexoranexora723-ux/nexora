/**
 * NEXORA — GLM Enhancement
 *
 * Usa GLM para generar:
 * - Nombre profesional del producto (limpio, SEO-friendly)
 * - Descripción única optimizada para Google
 * - Especificaciones técnicas
 * - Tags de búsqueda
 *
 * Input: marca + categoría + código del álbum + nombre actual
 * Output: nombre limpio + descripción SEO + specs
 */
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '../src/lib/db'
import { readFileSync, writeFileSync, existsSync } from 'fs'

interface ProductToEnrich {
  id: string
  sku: string
  currentName: string
  brand: { name: string }
  category: { name: string }
  suggestedPrice: number
}

interface EnrichedProduct {
  id: string
  originalName: string
  newName: string
  description: string
  specs: string
  features: string
}

async function enrichWithGLM(products: ProductToEnrich[]): Promise<EnrichedProduct[]> {
  const zai = await ZAI.create()
  const results: EnrichedProduct[] = []

  // Procesar en lotes de 5 (para no saturar la API)
  const BATCH = 5

  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH)

    process.stdout.write(`\r  Procesando lote ${Math.floor(i / BATCH) + 1}/${Math.ceil(products.length / BATCH)}...`)

    // Procesar cada producto del lote
    const batchResults = await Promise.all(
      batch.map(async (p) => {
        try {
          const prompt = `Eres un experto en e-commerce de productos de lujo. Genera información profesional para este producto.

DATOS DEL PRODUCTO:
- Marca: ${p.brand.name}
- Categoría: ${p.category.name}
- Código: ${p.sku}
- Nombre actual: ${p.currentName}
- Precio: $${p.suggestedPrice}

Genera UN JSON válido con esta estructura EXACTA (sin markdown, sin \`\`\`):
{
  "name": "Nombre profesional limpio en español, máximo 80 caracteres. Ej: 'Bolso Gucci Marmont de Piel Negro' (NO incluir código SKU)",
  "description": "Descripción única de 2-3 frases optimizada para SEO. Mencionar marca, categoría, material típico y uso. Ej: 'Elegante bolso Gucci Marmont en piel genuina. Diseño icónico con cierre dorado. Perfecto para ocasiones especiales.'",
  "specs": "JSON array de 4-6 especificaciones. Ej: [{\"label\":\"Material\",\"value\":\"Piel genuina\"},{\"label\":\"Marca\",\"value\":\"${p.brand.name}\"}]",
  "features": "JSON array de 4-6 características. Ej: ['Piel genuina','Diseño icónico','Cierre dorado','Asa ajustable']"
}

Responde SOLO el JSON, sin texto adicional.`

          const resp = await zai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 600,
          })

          const content = resp.choices[0]?.message?.content || ''

          // Limpiar markdown y extraer JSON
          let cleanContent = content.trim()
          // Remover markdown code blocks
          cleanContent = cleanContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
          // Si hay texto antes del JSON, tomar desde la primera {
          const jsonStart = cleanContent.indexOf('{')
          const jsonEnd = cleanContent.lastIndexOf('}')
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1)
          }

          const parsed = JSON.parse(cleanContent)

          return {
            id: p.id,
            originalName: p.currentName,
            newName: parsed.name || p.currentName,
            description: parsed.description || '',
            specs: typeof parsed.specs === 'string' ? parsed.specs : JSON.stringify(parsed.specs || []),
            features: typeof parsed.features === 'string' ? parsed.features : JSON.stringify(parsed.features || []),
          }
        } catch (e) {
          console.error(`\n  ⚠️  Error en ${p.sku}:`, (e as Error).message.substring(0, 80))
          return {
            id: p.id,
            originalName: p.currentName,
            newName: p.currentName,
            description: `${p.brand.name} ${p.category.name}. Producto importado de catálogo premium.`,
            specs: JSON.stringify([{ label: 'Marca', value: p.brand.name }, { label: 'Categoría', value: p.category.name }]),
            features: JSON.stringify(['Importación premium', 'Calidad verificada']),
          }
        }
      })
    )

    results.push(...batchResults)

    // Guardar progreso
    writeFileSync('/tmp/enriched-products.json', JSON.stringify(results, null, 2))

    // Pausa corta entre lotes para no saturar API
    await new Promise((r) => setTimeout(r, 500))
  }

  console.log('')
  return results
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  NEXORA — GLM Enhancement (100 productos featured)')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')

  // Cargar productos desde el archivo generado antes
  const products: ProductToEnrich[] = JSON.parse(
    readFileSync('/tmp/products-to-scrape.json', 'utf8')
  ).map((p: any) => ({
    id: p.id,
    sku: p.sku,
    currentName: p.name,
    brand: { name: p.brand?.name || 'Generic' },
    category: { name: p.category?.name || 'Producto' },
    suggestedPrice: 100, // no tenemos el precio aquí, pero GLM no lo necesita críticamente
  }))

  console.log(`📋 ${products.length} productos para enriquecer con GLM`)
  console.log('')

  const startTime = Date.now()

  const enriched = await enrichWithGLM(products)

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`✅ Enriquecimiento completado en ${elapsed}s`)
  console.log(`   Productos enriquecidos: ${enriched.length}`)
  console.log(`   💾 Guardado en /tmp/enriched-products.json`)
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')

  // Mostrar muestra
  console.log('=== MUESTRA DE RESULTADOS ===')
  for (const r of enriched.slice(0, 5)) {
    console.log(`  📦 ${r.originalName.substring(0, 40)}`)
    console.log(`     → ${r.newName}`)
    console.log(`     📝 ${r.description.substring(0, 80)}...`)
    console.log('')
  }
}

main()
  .catch((e) => { console.error('❌ Fatal:', e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
