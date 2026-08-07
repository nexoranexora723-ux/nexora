/**
 * NEXORA — Yupoo Importer · Scanner (Descubrimiento) — v2.1 FIXED
 * ====================================================================
 *
 * CAMBIOS IMPORTANTES vs v2.0:
 * - NUNCA construye URLs de álbumes manualmente
 * - Usa el href EXACTO del DOM (con query params uid, isSubCate, referrercate)
 * - Extrae el atributo title del <a> como nombre original
 * - Extrae photoCount de .album__photonumber
 * - Extrae thumbnailHash del <img> dentro del card
 * - Valida que el href contenga uid= y referrercate=
 *
 * ESTRUCTURA DEL CARD DE ÁLBUM EN YUPOO:
 * <div class="categories__parent album__categories-box">
 *   <div class="categories__children">
 *     <a class="album__main"
 *        title="Gucci bags yupoo Gucci tote bag(D6B3)"
 *        href="/albums/182425674?uid=1&isSubCate=false&referrercate=3478225">
 *       <div class="album__imgwrap">
 *         <img src="https://photo.yupoo.com/paypalshop/780e18d4/medium.jpg">
 *         <div class="text_overflow album__photonumber">10</div>
 *       </div>
 *     </a>
 *   </div>
 * </div>
 */

import {
  YUPOO_BASE_URL,
  YUPOO_ALBUMS_PATH,
  MAX_PAGES_PER_CATEGORY,
  ALBUMS_PER_PAGE_THRESHOLD,
  DEFAULT_FETCH_STRATEGY,
  type FetchStrategy,
} from './config'
import { fetchPage, loadHtml, hasCategoryContent } from './fetcher'
import { cleanCategoryName, extractHash, logger } from './utils'
import type { YupooCategory, YupooAlbumRef, CategoryScanResult } from './types'

// ============================================================================
// VALIDACIÓN DE HREF
// ============================================================================

/**
 * Valida que un href de álbum contenga los parámetros obligatorios.
 *
 * Yupoo REQUIERE uid= y referrercate= en la URL del álbum.
 * Sin estos parámetros, devuelve 404.
 *
 * @param href - href exacto del DOM
 * @returns true si el href es válido
 */
export function isValidAlbumHref(href: string): boolean {
  if (!href) return false
  const hasUid = href.includes('uid=')
  const hasReferrercate = href.includes('referrercate=')
  const hasAlbumId = /\/albums\/\d+/.test(href)
  return hasUid && hasReferrercate && hasAlbumId
}

// ============================================================================
// ESCANEO DE CATEGORÍAS
// ============================================================================

/**
 * Escanea la homepage de Yupoo y descubre todas las categorías.
 */
export async function scanCategories(
  strategy: FetchStrategy = DEFAULT_FETCH_STRATEGY
): Promise<YupooCategory[]> {
  const url = `${YUPOO_BASE_URL}${YUPOO_ALBUMS_PATH}`
  logger.info(`Escaneando categorías desde: ${url}`)

  const result = await fetchPage(url, strategy, hasCategoryContent)

  if (!result.success || !result.html) {
    logger.error(`No se pudo obtener la homepage: ${result.error}`)
    return []
  }

  const categories = extractCategoriesFromHtml(result.html)
  logger.info(`✓ ${categories.length} categorías descubiertas`)

  return categories
}

/**
 * Extrae categorías desde el HTML usando Cheerio.
 */
function extractCategoriesFromHtml(html: string): YupooCategory[] {
  const $ = loadHtml(html)
  const categories: YupooCategory[] = []
  const seen = new Set<string>()
  const now = new Date().toISOString()

  $('a[href*="/categories/"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const id = extractCategoryIdFromHref(href)
    if (!id || id === '0' || seen.has(id)) return

    const rawName = $(el).text().trim() || $(el).find('img').attr('alt') || ''
    const name = cleanCategoryName(rawName)
    if (name.length < 2) return

    seen.add(id)
    categories.push({
      id,
      name,
      url: `${YUPOO_BASE_URL}/categories/${id}`,
      albumCount: 0,
      discoveredAt: now,
    })
  })

  return categories
}

function extractCategoryIdFromHref(href: string): string | null {
  const match = href.match(/\/categories\/(\d+)/)
  return match ? match[1] : null
}

// ============================================================================
// ESCANEO DE ÁLBUMES POR CATEGORÍA
// ============================================================================

/**
 * Escanea una categoría específica y descubre todos sus álbumes.
 *
 * EXTRAE DEL DOM DE CADA CARD DE ÁLBUM:
 * - href exacto (con query params)
 * - title (nombre original del producto)
 * - thumbnailHash (de la imagen del card)
 * - photoCount (de .album__photonumber)
 * - albumId (extraído del href)
 * - categoryId (de la categoría being scanned)
 */
export async function scanAlbumsFromCategory(
  category: YupooCategory,
  maxPages: number = MAX_PAGES_PER_CATEGORY,
  strategy: FetchStrategy = DEFAULT_FETCH_STRATEGY
): Promise<CategoryScanResult> {
  logger.info(`Escaneando categoría: ${category.name} (${category.id})`)

  const albums: YupooAlbumRef[] = []
  const seenAlbumIds = new Set<string>()
  let pagesScraped = 0
  let invalidHrefs = 0

  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? category.url : `${category.url}?page=${page}`
    logger.debug(`Página ${page}: ${url}`)

    const result = await fetchPage(url, strategy, (html) => {
      const $ = loadHtml(html)
      return $(`a[href*="/albums/"]`).length > 0
    })

    if (!result.success || !result.html) {
      logger.warn(`Página ${page} falló para categoría ${category.id}`)
      break
    }

    const { albums: pageAlbums, invalidCount } = extractAlbumsFromHtml(
      result.html,
      category.id,
      page
    )
    invalidHrefs += invalidCount

    if (pageAlbums.length === 0) {
      logger.debug(`Página ${page} no tiene álbumes válidos, fin de categoría`)
      break
    }

    // Agregar álbumes no duplicados
    for (const album of pageAlbums) {
      if (!seenAlbumIds.has(album.id)) {
        seenAlbumIds.add(album.id)
        albums.push(album)
      }
    }

    pagesScraped++

    if (pageAlbums.length < ALBUMS_PER_PAGE_THRESHOLD) {
      logger.debug(`Página ${page} con ${pageAlbums.length} álbumes (< ${ALBUMS_PER_PAGE_THRESHOLD}), fin`)
      break
    }
  }

  category.albumCount = albums.length

  if (invalidHrefs > 0) {
    logger.warn(`⚠️  ${invalidHrefs} hrefs inválidos detectados (sin uid= o referrercate=)`)
  }

  logger.info(`✓ Categoría ${category.name}: ${albums.length} álbumes en ${pagesScraped} páginas`)

  return {
    category,
    albums,
    pagesScraped,
    success: albums.length > 0,
  }
}

/**
 * Extrae álbumes desde el HTML de una página de categoría.
 *
 * USA EXCLUSIVAMENTE EL HREF EXACTO DEL DOM.
 * NUNCA construye URLs manualmente.
 *
 * Estructura del card:
 * <a class="album__main" title="..." href="/albums/123?uid=1&isSubCate=false&referrercate=456">
 *   <div class="album__imgwrap">
 *     <img src="https://photo.yupoo.com/paypalshop/HASH/medium.jpg">
 *     <div class="album__photonumber">10</div>
 *   </div>
 * </a>
 */
function extractAlbumsFromHtml(
  html: string,
  categoryId: string,
  pageNumber: number
): { albums: YupooAlbumRef[]; invalidCount: number } {
  const $ = loadHtml(html)
  const albums: YupooAlbumRef[] = []
  const seen = new Set<string>()
  const now = new Date().toISOString()
  let invalidCount = 0

  // Buscar todos los <a> con href que contenga /albums/
  $('a[href*="/albums/"]').each((_, el) => {
    // === 1. HREF EXACTO del DOM (NUNCA reconstruir) ===
    const href = $(el).attr('href') || ''
    if (!href) return

    // === 2. Validar que el href tenga uid= y referrercate= ===
    if (!isValidAlbumHref(href)) {
      invalidCount++
      return
    }

    // === 3. Extraer albumId del href ===
    const albumIdMatch = href.match(/\/albums\/(\d+)/)
    if (!albumIdMatch) return
    const albumId = albumIdMatch[1]
    if (seen.has(albumId)) return
    seen.add(albumId)

    // === 4. TITLE (nombre original del producto) ===
    const title = $(el).attr('title') || ''

    // === 5. THUMBNAIL HASH ===
    let thumbnailHash: string | null = null
    const img = $(el).find('img[src*="photo.yupoo.com/paypalshop/"]').first()
    if (img.length) {
      const src = img.attr('src') || img.attr('data-src') || ''
      thumbnailHash = extractHash(src)
    }

    // === 6. PHOTO COUNT (de .album__photonumber) ===
    let photoCount: number | null = null
    const photoNumEl = $(el).find('.album__photonumber').first()
    if (photoNumEl.length) {
      const numText = photoNumEl.text().trim()
      const num = parseInt(numText)
      if (!isNaN(num)) photoCount = num
    }

    // === 7. URL completa (base + href exacto) ===
    const fullUrl = href.startsWith('http')
      ? href
      : `${YUPOO_BASE_URL}${href}`

    albums.push({
      id: albumId,
      href, // href EXACTO del DOM
      url: fullUrl, // URL completa para navegar
      title, // nombre original del producto
      categoryId,
      thumbnailHash,
      photoCount,
      pageNumber,
      discoveredAt: now,
    })
  })

  return { albums, invalidCount }
}

// ============================================================================
// ESCANEO COMPLETO
// ============================================================================

export async function scanAll(
  strategy: FetchStrategy = DEFAULT_FETCH_STRATEGY,
  maxPagesPerCategory?: number,
  onCategoryProgress?: (catIndex: number, totalCats: number, cat: YupooCategory, albumsFound: number) => void
): Promise<{
  categories: YupooCategory[]
  albumRefs: YupooAlbumRef[]
}> {
  logger.info('Iniciando escaneo completo...')

  const categories = await scanCategories(strategy)
  if (categories.length === 0) {
    logger.error('No se encontraron categorías')
    return { categories: [], albumRefs: [] }
  }

  const allAlbumRefs: YupooAlbumRef[] = []

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i]
    const result = await scanAlbumsFromCategory(cat, maxPagesPerCategory, strategy)
    allAlbumRefs.push(...result.albums)
    onCategoryProgress?.(i + 1, categories.length, cat, result.albums.length)
  }

  logger.info(`✓ Escaneo completo: ${categories.length} categorías, ${allAlbumRefs.length} álbumes`)

  return { categories, albumRefs: allAlbumRefs }
}
