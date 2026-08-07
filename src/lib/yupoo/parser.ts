/**
 * NEXORA — Yupoo Importer · Parser (Extracción) — IMPLEMENTADO
 * ===============================================================
 *
 * Módulo: src/lib/yupoo/parser.ts
 *
 * RESPONSABILIDAD
 * ---------------
 * Extraer el contenido completo de un álbum individual de Yupoo:
 *   - Nombre original (del title o h1 del HTML)
 *   - Descripción (si existe)
 *   - TODAS las imágenes (hashes en orden del DOM)
 *   - TODOS los videos (si los hay)
 *   - Precio (si está visible)
 *
 * REGLAS ESTRICTAS
 * ----------------
 * 1. Toda la información proviene del HTML del álbum
 * 2. NO se usa IA, OCR, ni visión artificial
 * 3. NO se inventan nombres
 * 4. Cada álbum = exactamente UN producto
 *
 * ARQUITECTURA HÍBRIDA
 * --------------------
 * - HTTP + Cheerio primero
 * - Playwright solo si HTTP no obtiene imágenes
 */

import {
  DEFAULT_FETCH_STRATEGY,
  HASH_REGEX,
  MAX_IMAGES_PER_ALBUM,
  MAX_VIDEOS_PER_ALBUM,
  type FetchStrategy,
} from './config'
import { fetchPage, loadHtml, isAlbumNotFound } from './fetcher'
import {
  cleanAlbumName,
  buildYupooImage,
  extractHash,
  dedupeHashes,
  logger,
} from './utils'
import type { YupooAlbumRef, YupooAlbum, AlbumParseResult, YupooImage, YupooVideo } from './types'

// ============================================================================
// PARSEO DE ÁLBUM INDIVIDUAL
// ============================================================================

/**
 * Parsea un álbum individual de Yupoo y extrae TODO su contenido.
 */
export async function parseAlbum(
  albumRef: YupooAlbumRef,
  strategy: FetchStrategy = DEFAULT_FETCH_STRATEGY
): Promise<AlbumParseResult> {
  const startTime = Date.now()
  logger.debug(`Parseando álbum ${albumRef.id}...`)

  const result = await fetchPage(albumRef.url, strategy, (html) => {
    // Verificar que el HTML tiene imágenes del álbum
    const $ = loadHtml(html)
    return $(`img[src*="photo.yupoo.com/paypalshop/"]`).length > 0 ||
           $(`[data-src*="photo.yupoo.com/paypalshop/"]`).length > 0
  })

  if (!result.success || !result.html) {
    return {
      album: null,
      success: false,
      error: result.error || 'No se pudo obtener el HTML',
      durationMs: Date.now() - startTime,
    }
  }

  // Verificar si el álbum no existe (404)
  if (isAlbumNotFound(result.html)) {
    return {
      album: null,
      success: false,
      error: 'Álbum no encontrado (404)',
      durationMs: Date.now() - startTime,
    }
  }

  // Parsear el HTML
  const album = parseAlbumHtml(result.html, albumRef, result.method)

  if (!album) {
    return {
      album: null,
      success: false,
      error: 'Error al parsear el HTML del álbum',
      durationMs: Date.now() - startTime,
    }
  }

  return {
    album,
    success: true,
    durationMs: Date.now() - startTime,
  }
}

// ============================================================================
// PARSER DE HTML (con Cheerio)
// ============================================================================

/**
 * Parsea el HTML de un álbum y extrae todos los datos.
 */
function parseAlbumHtml(
  html: string,
  albumRef: YupooAlbumRef,
  fetchMethod: 'http' | 'playwright'
): YupooAlbum | null {
  const $ = loadHtml(html)
  const now = new Date().toISOString()

  // 1. Extraer nombre
  const name = extractName($)
  if (!name) {
    logger.warn(`Álbum ${albumRef.id}: no se pudo extraer nombre`)
  }

  // 2. Extraer descripción
  const description = extractDescription($)

  // 3. Extraer imágenes (hashes en orden del DOM)
  const hashes = extractImageHashes($)
  const images: YupooImage[] = hashes.slice(0, MAX_IMAGES_PER_ALBUM).map((hash, order) =>
    buildYupooImage(hash, order)
  )

  // 4. Extraer videos
  const videos = extractVideos($).slice(0, MAX_VIDEOS_PER_ALBUM)

  // 5. Extraer precio (si existe)
  const priceRaw = extractPrice($)

  return {
    id: albumRef.id,
    url: albumRef.url,
    name: name || '',
    description,
    categoryId: albumRef.categoryId,
    categoryName: null, // se llenará desde el scanner
    images,
    videos,
    priceRaw,
    scrapedAt: now,
    exists: true,
  }
}

// ============================================================================
// EXTRACTORES INDIVIDUALES
// ============================================================================

/**
 * Extrae el nombre del álbum.
 * Busca en: <title>, h1, .show-index__albumName
 */
function extractName($: ReturnType<typeof loadHtml>): string | null {
  // Intentar 1: title del document
  const title = $('title').first().text().trim()
  if (title) {
    const cleaned = cleanAlbumName(title)
    if (cleaned) return cleaned
  }

  // Intentar 2: h1
  const h1 = $('h1').first().text().trim()
  if (h1 && !h1.includes('又拍图片管家')) {
    const cleaned = cleanAlbumName(h1)
    if (cleaned) return cleaned
  }

  // Intentar 3: .show-index__albumName
  const albumName = $('.show-index__albumName').first().text().trim()
  if (albumName) {
    const cleaned = cleanAlbumName(albumName)
    if (cleaned) return cleaned
  }

  return null
}

/**
 * Extrae la descripción del álbum si existe.
 */
function extractDescription($: ReturnType<typeof loadHtml>): string | null {
  const selectors = [
    '.show-index__albumDescription',
    '.album__description',
    '.description',
    '[class*="albumDesc"]',
  ]

  for (const sel of selectors) {
    const el = $(sel).first()
    if (el.length) {
      const text = el.text().trim()
      if (text.length > 10) return text
    }
  }

  return null
}

/**
 * Extrae todos los hashes de imágenes del álbum.
 * Busca en img[src] y [data-src] que apunten a photo.yupoo.com/paypalshop/
 */
function extractImageHashes($: ReturnType<typeof loadHtml>): string[] {
  const hashes: string[] = []

  // Buscar en img[src]
  $('img[src*="photo.yupoo.com/paypalshop/"]').each((_, el) => {
    const src = $(el).attr('src') || ''
    const hash = extractHash(src)
    if (hash) hashes.push(hash)
  })

  // Buscar en [data-src] (lazy load)
  $('[data-src*="photo.yupoo.com/paypalshop/"]').each((_, el) => {
    const src = $(el).attr('data-src') || ''
    const hash = extractHash(src)
    if (hash) hashes.push(hash)
  })

  // Buscar en cualquier atributo que contenga la URL de Yupoo
  $('[style*="photo.yupoo.com/paypalshop/"]').each((_, el) => {
    const style = $(el).attr('style') || ''
    const matches = style.matchAll(HASH_REGEX)
    for (const m of matches) {
      if (m[1]) hashes.push(m[1])
    }
  })

  return dedupeHashes(hashes)
}

/**
 * Extrae videos del álbum si los hay.
 */
function extractVideos($: ReturnType<typeof loadHtml>): YupooVideo[] {
  const videos: YupooVideo[] = []
  let order = 0

  // Buscar elementos <video>
  $('video').each((_, el) => {
    const src = $(el).attr('src') || $(el).find('source').attr('src') || ''
    if (src.includes('paypalshop') || src.includes('yupoo')) {
      const hash = extractHash(src)
      videos.push({
        url: src,
        hash: hash || undefined,
        order: order++,
      })
    }
  })

  // Buscar [data-video-url]
  $('[data-video-url]').each((_, el) => {
    const url = $(el).attr('data-video-url') || ''
    if (url) {
      videos.push({
        url,
        hash: extractHash(url) || undefined,
        order: order++,
      })
    }
  })

  return videos
}

/**
 * Extrae el precio si está visible en el álbum.
 */
function extractPrice($: ReturnType<typeof loadHtml>): string | null {
  const selectors = [
    '.show-index__albumPrice',
    '.album__price',
    '.price',
    '[class*="price"]',
  ]

  for (const sel of selectors) {
    const el = $(sel).first()
    if (el.length) {
      const text = el.text().trim()
      if (text && /\d/.test(text)) return text
    }
  }

  return null
}

// ============================================================================
// PARSEO BATCH (múltiples álbumes)
// ============================================================================

/**
 * Parsea múltiples álbumes en paralelo (con límite de concurrencia).
 */
export async function parseAlbumsBatch(
  albumRefs: YupooAlbumRef[],
  strategy: FetchStrategy = DEFAULT_FETCH_STRATEGY,
  onProgress?: (index: number, total: number, result: AlbumParseResult) => void
): Promise<AlbumParseResult[]> {
  const results: AlbumParseResult[] = []
  const CONCURRENT = 3 // procesar 3 a la vez

  for (let i = 0; i < albumRefs.length; i += CONCURRENT) {
    const batch = albumRefs.slice(i, i + CONCURRENT)
    const batchResults = await Promise.all(
      batch.map((ref) => parseAlbum(ref, strategy))
    )

    for (let j = 0; j < batchResults.length; j++) {
      const idx = i + j
      results.push(batchResults[j])
      onProgress?.(idx + 1, albumRefs.length, batchResults[j])
    }
  }

  return results
}
