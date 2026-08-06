/**
 * NEXORA — Marketing Tools Integration
 *
 * - Instagram Shopping feed
 * - Blog SEO (meta tags dinámicos)
 * - Programa de afiliados (códigos de referido + tracking)
 * - Mailchimp newsletter (form + API integration)
 */

// ============================================================================
// INSTAGRAM SHOPPING
// ============================================================================

export interface InstagramPost {
  id: string
  imageUrl: string
  caption: string
  permalink: string
  timestamp: string
  likes: number
  comments: number
}

/**
 * Genera URL de Instagram con el handle de NEXORA
 */
export const INSTAGRAM_HANDLE = 'nexora.importaciones'
export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`

/**
 * Genera URL para "Compartir en Instagram" (story)
 */
export function buildInstagramShareUrl(imageUrl: string, caption: string): string {
  // Instagram no permite compartir via URL directamente, pero podemos
  // abrir la app con un texto pre-armado
  const text = encodeURIComponent(`${caption}\n\nVisto en NEXORA`)
  return `https://www.instagram.com/?text=${text}`
}

/**
 * Genera feed de Instagram mock basado en productos destacados
 * (Para producción, conectar con Instagram Graph API)
 */
export function generateInstagramFeedFromProducts(products: Array<{
  id: string
  name: string
  imageUrl: string | null
  suggestedPrice: number
}>): InstagramPost[] {
  return products.map((p, idx) => ({
    id: `ig_${p.id}_${idx}`,
    imageUrl: p.imageUrl || '/products/placeholder.svg',
    caption: `✨ ${p.name}\n\n💵 $${p.suggestedPrice}\n\nLink en bio para comprar 🛍️\n\n#nexora #importaciones #luxury #${idx % 2 === 0 ? 'bolsos' : 'moda'}`,
    permalink: `${INSTAGRAM_URL}/p/${p.id}`,
    timestamp: new Date(Date.now() - idx * 86400000).toISOString(),
    likes: Math.floor(Math.random() * 500) + 50,
    comments: Math.floor(Math.random() * 30) + 5,
  }))
}

// ============================================================================
// PROGRAMA DE AFILIADOS
// ============================================================================

export interface Affiliate {
  code: string // código único (ej: NEXORA-JUAN10)
  name: string
  email: string
  commissionPct: number // % de comisión por venta
  totalReferrals: number
  totalEarnings: number
  createdAt: string
}

/**
 * Genera código de afiliado único
 */
export function generateAffiliateCode(name: string): string {
  const cleaned = name.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 8)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `NEXORA-${cleaned || 'USER'}-${random}`
}

/**
 * Genera URL de referido con código de afiliado
 */
export function buildReferralUrl(affiliateCode: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://nexora-inky-mu.vercel.app'
  return `${base}/?ref=${affiliateCode}`
}

/**
 * Calcula comisión por venta
 */
export function calculateCommission(
  saleAmount: number,
  commissionPct: number
): number {
  return Math.round(saleAmount * (commissionPct / 100) * 100) / 100
}

// ============================================================================
// MAILCHIMP NEWSLETTER
// ============================================================================

/**
 * Mailchimp API integration.
 * Requiere variables de entorno:
 *   - MAILCHIMP_API_KEY
 *   - MAILCHIMP_LIST_ID
 *   - MAILCHIMP_SERVER_PREFIX (ej: us1)
 */
export async function subscribeToNewsletter(email: string, name?: string): Promise<{
  success: boolean
  message: string
}> {
  const apiKey = process.env.MAILCHIMP_API_KEY
  const listId = process.env.MAILCHIMP_LIST_ID
  const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX

  if (!apiKey || !listId || !serverPrefix) {
    // Sin Mailchimp configurado: fallback a guardar localmente
    // (en producción esto se conectaría a Mailchimp API)
    return {
      success: true,
      message: 'Te has suscrito al newsletter (modo demo - sin Mailchimp configurado)',
    }
  }

  try {
    const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members`
    const data = {
      email_address: email,
      status: 'subscribed',
      merge_fields: name ? { FNAME: name.split(' ')[0], LNAME: name.split(' ').slice(1).join(' ') } : undefined,
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (resp.ok) {
      return { success: true, message: '¡Te has suscrito exitosamente!' }
    }

    const err = await resp.json()
    if (err.title === 'Member Exists') {
      return { success: true, message: 'Ya estabas suscrito al newsletter' }
    }
    throw new Error(err.detail || 'Error al suscribir')
  } catch (e) {
    return {
      success: false,
      message: `Error: ${(e as Error).message}`,
    }
  }
}

// ============================================================================
// SEO HELPERS
// ============================================================================

export interface SEOData {
  title: string
  description: string
  keywords: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
}

/**
 * Genera meta tags para SEO (usar en metadata de Next.js)
 */
export function buildSEOMetadata(data: SEOData) {
  const baseUrl = 'https://nexora-inky-mu.vercel.app'
  const url = data.url ? `${baseUrl}${data.url}` : baseUrl
  const image = data.image || '/icons/logo-official.png'

  return {
    title: data.title,
    description: data.description,
    keywords: data.keywords.join(', '),
    openGraph: {
      title: data.title,
      description: data.description,
      url,
      siteName: 'NEXORA',
      images: [{ url: image, width: 1200, height: 630 }],
      type: data.type || 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.description,
      images: [image],
    },
  }
}
