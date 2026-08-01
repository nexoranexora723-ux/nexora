import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { blogArticles } from '@/lib/blog/articles'

const SITE_URL = 'https://nexora-inky-mu.vercel.app'

/**
 * Sitemap dinámico de NEXORA.
 *
 * Incluye:
 *   - Homepage
 *   - Blog index + todos los artículos (src/lib/blog/articles.ts)
 *   - Todas las categorías (DB)
 *   - Top 1000 productos (DB, limitado para evitar problemas de memoria)
 *   - Páginas estáticas legales/útiles
 *
 * Es un Server Component route handler (Next.js Metadata API).
 * En caso de error de base de datos, devolvemos el sitemap mínimo sin caer.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  // ----- Static top-level -----
  entries.push({
    url: `${SITE_URL}/`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 1,
  })

  // ----- Páginas estáticas legales/útiles -----
  const staticPages: { path: string; freq: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
    { path: '/terminos', freq: 'yearly', priority: 0.4 },
    { path: '/privacidad', freq: 'yearly', priority: 0.4 },
    { path: '/devoluciones', freq: 'yearly', priority: 0.4 },
    { path: '/faq', freq: 'monthly', priority: 0.6 },
    { path: '/track-order', freq: 'monthly', priority: 0.5 },
    { path: '/referidos', freq: 'monthly', priority: 0.5 },
    { path: '/blog', freq: 'weekly', priority: 0.7 },
  ]
  for (const p of staticPages) {
    entries.push({
      url: `${SITE_URL}${p.path}`,
      lastModified: now,
      changeFrequency: p.freq,
      priority: p.priority,
    })
  }

  // ----- Blog: index + artículos -----
  for (const article of blogArticles) {
    entries.push({
      url: `${SITE_URL}/blog/${article.slug}`,
      lastModified: new Date(article.updatedAt ?? article.publishedAt),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  // ----- Categorías (DB) -----
  try {
    const categories = await db.category.findMany({
      select: { id: true, slug: true, name: true },
      orderBy: { name: 'asc' },
    })
    for (const c of categories) {
      entries.push({
        url: `${SITE_URL}/?category=${encodeURIComponent(c.slug || c.id)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.5,
      })
    }
  } catch (err) {
    console.error('sitemap: no se pudieron leer categorías:', err)
  }

  // ----- Top 1000 productos (DB) -----
  try {
    const products = await db.product.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 1000,
    })
    for (const p of products) {
      entries.push({
        url: `${SITE_URL}/?product=${encodeURIComponent(p.id)}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.5,
      })
    }
  } catch (err) {
    console.error('sitemap: no se pudieron leer productos:', err)
  }

  return entries
}
