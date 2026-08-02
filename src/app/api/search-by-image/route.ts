import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, 'search-by-image', RATE_LIMITS.WRITE)
  if (limited) return limited

  try {
    const body = await req.json().catch(() => ({}))
    const { image } = body as { image?: string }

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 })
    }

    // Normalize data URL
    const dataUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`

    let description = ''
    let keywords: string[] = []

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()
      const result = await zai.chat.completions.createVision({
        messages: [{
          role: 'user',
          content: [
            { type: 'text' as const, text: 'Analiza esta imagen de un producto. Responde SOLO con JSON: {"description": "descripción breve en español", "keywords": ["palabra1", "palabra2"]}. Extrae 3-5 palabras clave (marca, tipo, color, material).' },
            { type: 'image_url' as const, image_url: { url: dataUrl } }
          ]
        }]
      } as any)

      const responseText = result.choices[0]?.message?.content ?? ''
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          description = parsed.description || ''
          keywords = Array.isArray(parsed.keywords) ? parsed.keywords.filter((k: unknown) => typeof k === 'string').map((k: string) => k.toLowerCase().trim()).filter(Boolean).slice(0, 8) : []
        } catch {}
      }
      if (!description) description = responseText.substring(0, 200)
    } catch (vlmError) {
      console.error('VLM error:', vlmError)
      return NextResponse.json({
        error: 'No pude analizar la imagen. Intenta con una foto más clara del producto.',
        description: '', keywords: [], products: [], count: 0,
      }, { status: 500 })
    }

    if (keywords.length === 0) {
      return NextResponse.json({
        description: description || 'No pude identificar el producto',
        keywords: [], products: [], count: 0,
      })
    }

    // Search products by first keyword
    const products = await db.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: keywords[0], mode: 'insensitive' } },
          { brand: { name: { contains: keywords[0], mode: 'insensitive' } } },
          { category: { name: { contains: keywords[0], mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true, name: true, imageUrl: true,
        estimatedCost: true, currencyCode: true,
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, icon: true } },
      },
      take: 20,
      orderBy: { isFeatured: 'desc' },
    })

    return NextResponse.json({
      description, keywords, products, count: products.length,
    })
  } catch (error) {
    console.error('POST /api/search-by-image error:', error)
    return NextResponse.json({ error: 'Error al procesar la imagen' }, { status: 500 })
  }
}
