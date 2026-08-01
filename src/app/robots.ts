import type { MetadataRoute } from 'next'

const SITE_URL = 'https://nexora-inky-mu.vercel.app'

/**
 * robots.txt dinámico de NEXORA.
 *
 * - Permite todos los crawlers en rutas públicas.
 * - Bloquea /api/ y /admin (rutas internas / privadas).
 * - Apunta al sitemap.xml.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
