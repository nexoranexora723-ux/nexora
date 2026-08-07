/**
 * NEXORA — Yupoo Importer · Scanner (Descubrimiento) — IMPLEMENTADO
 * ====================================================================
 *
 * Módulo: src/lib/yupoo/scanner.ts
 *
 * RESPONSABILIDAD
 * ---------------
 * Descubrir la estructura del catálogo de Yupoo:
 *   1. Todas las categorías (desde la homepage)
 *   2. Todos los álbumes dentro de cada categoría (paginando)
 *
 * ARQUITECTURA HÍBRIDA
 * --------------------
 * - HTTP + Cheerio como primera opción
 * - Playwright únicamente cuando HTTP no obtiene contenido
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
import { cleanCategoryName, extractAlbumId, extractHash, logger } from './utils'
import type { YupooCategory, YupooAlbumRef, CategoryScanResult } from './types'

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

  // Buscar todos los links a /categories/{id}
  $('a[href*="/categories/"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const id = extractCategoryIdFromHref(href)
    if (!id || id === '0' || seen.has(id)) return

    // Extraer el nombre (texto visible del link)
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

/**
 * Extrae el ID de categoría desde un href.
 */
function extractCategoryIdFromHref(href: string): string | null {
  const match = href.match(/\/categories\/(\d+)/)
  return match ? match[1] : null
}

// ============================================================================
// ESCANEO DE ÁLBUMES POR CATEGORÍA
// ============================================================================

/**
 * Escanea una categoría específica y descubre todos sus álbumes.
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

    const pageAlbums = extractAlbumsFromHtml(result.html, category.id, page)

    if (pageAlbums.length === 0) {
      logger.debug(`Página ${page} no tiene álbumes, fin de categoría`)
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

    // Si la página tuvo menos álbumes que el threshold, es la última
    if (pageAlbums.length < ALBUMS_PER_PAGE_THRESHOLD) {
      logger.debug(`Página ${page} con ${pageAlbums.length} álbumes (< ${ALBUMS_PER_PAGE_THRESHOLD}), fin`)
      break
    }
  }

  // Actualizar el contador de álbumes en la categoría
  category.albumCount = albums.length

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
 */
function extractAlbumsFromHtml(
  html: string,
  categoryId: string,
  pageNumber: number
): YupooAlbumRef[] {
  const $ = loadHtml(html)
  const albums: YupooAlbumRef[] = []
  const seen = new Set<string>()
  const now = new Date().toISOString()

  // Buscar todos los links a /albums/{id}
  $('a[href*="/albums/"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const albumId = extractAlbumId(href)
    if (!albumId || seen.has(albumId)) return

    seen.add(albumId)

    // Buscar hash de la miniatura (primer img dentro del link o cerca)
    let thumbnailHash: string | undefined
    const img = $(el).find('img[src*="photo.yupoo.com/paypalshop/"]').first()
    if (img.length) {
      const src = img.attr('src') || img.attr('data-src') || ''
      thumbnailHash = extractHash(src) || undefined
    }

    albums.push({
      id: albumId,
      url: `${YUPOO_BASE_URL}/albums/${albumId}`,
      categoryId,
      thumbnailHash,
      pageNumber,
      discoveredAt: now,
    })
  })

  return albums
}

// ============================================================================
// ESCANEO COMPLETO
// ============================================================================

/**
 * Escanea TODAS las categorías y sus álbumes.
 */
export async function scanAll(
  strategy: FetchStrategy = DEFAULT_FETCH_STRATEGY,
  maxPagesPerCategory?: number,
  onCategoryProgress?: (catIndex: number, totalCats: number, cat: YupooCategory, albumsFound: number) => void
): Promise<{
  categories: YupooCategory[]
  albumRefs: YupooAlbumRef[]
}> {
  logger.info('Iniciando escaneo completo...')

  // 1. Descubrir categorías
  const categories = await scanCategories(strategy)
  if (categories.length === 0) {
    logger.error('No se encontraron categorías')
    return { categories: [], albumRefs: [] }
  }

  // 2. Escanear álbumes de cada categoría
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
