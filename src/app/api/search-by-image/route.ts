import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/search-by-image
 *
 * Body: { image: string (data URL or base64), mimeType?: string }
 *
 * Flow:
 *   1. Receive base64 image (data URL or raw base64).
 *   2. Use the VLM (chat.completions.createVision) to describe the image
 *      and extract product-search keywords in Spanish + English.
 *   3. Run a fuzzy product search against the DB using the keywords.
 *   4. Return { description, keywords, products: [...] }.
 *
 * Rate-limited at 30 req/min per IP.
 */
export async function POST(req: NextRequest) {
  // Rate limit
  const limited = enforceRateLimit(req, 'search-by-image', RATE_LIMITS.WRITE)
  if (limited) return limited

  try {
    const body = await req.json().catch(() => ({}))
    const { image } = body as { image?: string }

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Se requiere una imagen (base64 o data URL).' },
        { status: 400 },
      )
    }

    // Normalize into a data URL the VLM can ingest.
    let dataUrl = image
    if (!dataUrl.startsWith('data:')) {
      // Assume raw base64 of a JPEG.
      dataUrl = `data:image/jpeg;base64,${image}`
    }

    // === Step 1: VLM describes the image and extracts search keywords ===
    let description = ''
    let keywords: string[] = []
    try {
      const zai = await ZAI.create()
      const vision = await zai.chat.completions.createVision({
        model: 'glm-4v-flash',
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente de búsqueda visual para NEXORA, una tienda de importaciones desde China. ' +
              'Analiza la imagen del usuario y responde SOLO con JSON válido, sin texto adicional, con este esquema:\n' +
              '{\n  "description": "descripción breve del producto en español (máx 12 palabras)",\n' +
              '  "keywords": ["keyword1", "keyword2", ...]  // 3-8 palabras clave en español e inglés que sirvan para buscar este producto\n' +
              '}\n' +
              'Si la imagen no muestra un producto claro, responde con {"description": "Imagen no clara", "keywords": []}.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Describe este producto y dame keywords de búsqueda.' },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
        thinking: { type: 'disabled' },
      })

      const raw = vision?.choices?.[0]?.message?.content ?? ''
      description = raw
      // Try to extract JSON from the response (it may be wrapped in ```json ... ```).
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.description) description = String(parsed.description)
          if (Array.isArray(parsed.keywords)) {
            keywords = parsed.keywords
              .filter((k: unknown): k is string => typeof k === 'string')
              .map((k: string) => k.trim().toLowerCase())
              .filter((k: string) => k.length > 0)
              .slice(0, 12)
          }
        } catch {
          // Keep raw text as description if JSON parse fails.
        }
      }
    } catch (vlmError) {
      console.error('VLM error in /api/search-by-image:', vlmError)
      // Continue with empty keywords — we'll return an empty product list.
    }

    // === Step 2: Search products by keywords ===
    const products = await searchProductsByKeywords(keywords)

    return NextResponse.json({
      description,
      keywords,
      count: products.length,
      products,
    })
  } catch (error) {
    console.error('POST /api/search-by-image error:', error)
    return NextResponse.json(
      { error: 'No se pudo analizar la imagen.' },
      { status: 500 },
    )
  }
}

/**
 * Fuzzy keyword search across product name, description, brand, category.
 * Returns up to 20 matches, ranked by number of keyword hits.
 */
async function searchProductsByKeywords(keywords: string[]): Promise<Array<{
  id: string
  name: string
  imageUrl: string | null
  estimatedCost: number | null
  currencyCode: string
  brand: { id: string; name: string } | null
  category: { id: string; name: string; icon: string | null } | null
  matchScore: number
}>> {
  if (keywords.length === 0) return []

  // Pull an active product corpus (limited to keep queries fast).
  const all = await db.product.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      estimatedCost: true,
      suggestedPrice: true,
      currencyCode: true,
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, icon: true } },
    },
    take: 500,
  })

  // Score each product by counting keyword hits across its text fields.
  const scored = all
    .map((p) => {
      const haystack = [
        p.name,
        p.description ?? '',
        p.brand?.name ?? '',
        p.category?.name ?? '',
      ]
        .join(' ')
        .toLowerCase()
      let score = 0
      for (const kw of keywords) {
        if (!kw) continue
        if (haystack.includes(kw)) score += 1
      }
      return {
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl,
        estimatedCost: p.estimatedCost,
        currencyCode: p.currencyCode,
        brand: p.brand,
        category: p.category,
        matchScore: score,
      }
    })
    .filter((p) => p.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20)

  return scored
}
