/**
 * NEXORA — Yupoo Importer · Parser (Extracción) — v2.1 FIXED
 * ====================================================================
 *
 * CAMBIOS IMPORTANTES vs v2.0:
 * - Usa EXCLUSIVAMENTE el href guardado por scanner.ts
 * - NUNCA reconstruye la URL del álbum
 * - Usa el title del <a> como nombre principal (no depende del H1)
 * - Si el title ya tiene el nombre, no necesita parsear el H1
 * - Conserva todos los metadatos del card (photoCount, thumbnailHash)
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
 *
 * USA EXCLUSIVAMENTE albumRef.url (que viene del href exacto del DOM).
 * NUNCA reconstruye la URL.
 */
export async function parseAlbum(
  albumRef: YupooAlbumRef,
  strategy: FetchStrategy = DEFAULT_FETCH_STRATEGY
): Promise<AlbumParseResult> {
  const startTime = Date.now()
  logger.debug(`Parseando álbum ${albumRef.id}...`)
  logger.debug(`  URL: ${albumRef.url}`)
  logger.debug(`  Title del card: ${albumRef.title}`)

  // Usar EXCLUSIVAMENTE la URL del albumRef (que viene del href exacto del DOM)
  const result = await fetchPage(albumRef.url, strategy, (html) => {
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

function parseAlbumHtml(
  html: string,
  albumRef: YupooAlbumRef,
  fetchMethod: 'http' | 'playwright'
): YupooAlbum | null {
  const $ = loadHtml(html)
  const now = new Date().toISOString()

  // === 1. NOMBRE ===
  // PRIORIDAD 1: title del card (albumRef.title) — ya extraído por scanner
  // PRIORIDAD 2: title del document
  // PRIORIDAD 3: h1
  let title = albumRef.title // nombre original del card
  let name = ''

  if (title) {
    // Limpiar el title del card
    name = cleanAlbumName(title) || title
  } else {
    // Fallback: title del document
    const docTitle = $('title').first().text().trim()
    if (docTitle) {
      title = docTitle.split(' | ')[0]
      name = cleanAlbumName(docTitle) || title
    }
  }

  // Si todavía no hay name, intentar h1
  if (!name) {
    const h1 = $('h1').first().text().trim()
    if (h1 && !h1.includes('又拍图片管家')) {
      title = title || h1
      name = cleanAlbumName(h1) || h1
    }
  }

  if (!name) {
    logger.warn(`Álbum ${albumRef.id}: no se pudo extraer nombre`)
  }

  // === 2. DESCRIPCIÓN ===
  const description = extractDescription($)

  // === 3. IMÁGENES ===
  const hashes = extractImageHashes($)
  const images: YupooImage[] = hashes.slice(0, MAX_IMAGES_PER_ALBUM).map((hash, order) =>
    buildYupooImage(hash, order)
  )

  // === 4. VIDEOS ===
  const videos = extractVideos($).slice(0, MAX_VIDEOS_PER_ALBUM)

  // === 5. PRECIO ===
  const priceRaw = extractPrice($)

  return {
    id: albumRef.id,
    url: albumRef.url, // URL exacta del scanner
    href: albumRef.href, // href exacto del DOM
    title, // nombre original (del card o document)
    name, // nombre limpio
    description,
    categoryId: albumRef.categoryId,
    categoryName: null,
    photoCount: albumRef.photoCount, // del card
    thumbnailHash: albumRef.thumbnailHash, // del card
    images,
    videos,
    priceRaw,
    fetchMethod,
    scrapedAt: now,
    exists: true,
  }
}

// ============================================================================
// EXTRACTORES INDIVIDUALES
// ============================================================================

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

function extractImageHashes($: ReturnType<typeof loadHtml>): string[] {
  const hashes: string[] = []

  $('img[src*="photo.yupoo.com/paypalshop/"]').each((_, el) => {
    const src = $(el).attr('src') || ''
    const hash = extractHash(src)
    if (hash) hashes.push(hash)
  })

  $('[data-src*="photo.yupoo.com/paypalshop/"]').each((_, el) => {
    const src = $(el).attr('data-src') || ''
    const hash = extractHash(src)
    if (hash) hashes.push(hash)
  })

  $('[style*="photo.yupoo.com/paypalshop/"]').each((_, el) => {
    const style = $(el).attr('style') || ''
    const matches = style.matchAll(HASH_REGEX)
    for (const m of matches) {
      if (m[1]) hashes.push(m[1])
    }
  })

  return dedupeHashes(hashes)
}

function extractVideos($: ReturnType<typeof loadHtml>): YupooVideo[] {
  const videos: YupooVideo[] = []
  let order = 0

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
// PARSEO BATCH
// ============================================================================

export async function parseAlbumsBatch(
  albumRefs: YupooAlbumRef[],
  strategy: FetchStrategy = DEFAULT_FETCH_STRATEGY,
  onProgress?: (index: number, total: number, result: AlbumParseResult) => void
): Promise<AlbumParseResult[]> {
  const results: AlbumParseResult[] = []
  const CONCURRENT = 3

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
