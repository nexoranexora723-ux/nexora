/**
 * NEXORA — Yupoo Importer · Utilidades
 * =======================================
 *
 * Módulo: src/lib/yupoo/utils.ts
 *
 * RESPONSABILIDAD
 * ---------------
 * Funciones puras de utilidad: normalización, validación,
 * conversión de tipos, logging. Sin efectos secundarios.
 *
 * Todas las funciones son PURAS (mismo input → mismo output).
 * No acceden a red, DB ni sistema de archivos.
 */

import { buildProxyUrl, isValidHash, isValidAlbumId, isValidCategoryId } from './config'
import type { YupooAlbum, ScrapedProduct, YupooImage } from './types'

// ============================================================================
// NORMALIZACIÓN DE NOMBRES
// ============================================================================

/**
 * Limpia un nombre de álbum de Yupoo eliminando texto innecesario.
 *
 * Yupoo agrega sufijos como:
 *   "yupoo nike tn shoes-020 | 相册 | Yupoo Gucci Bags..."
 *
 * Esta función extrae SOLO la parte relevante:
 *   "nike tn shoes-020"
 *
 * @param rawTitle - Título crudo del HTML (document.title o h1)
 * @returns Nombre limpio o null si no se pudo extraer
 */
export function cleanAlbumName(rawTitle: string): string | null {
  if (!rawTitle || typeof rawTitle !== 'string') return null

  let name = rawTitle.trim()

  // 1. Separar por " | " y tomar la primera parte
  //    (Yupoo siempre pone el nombre del producto primero)
  const pipeParts = name.split(' | ')
  if (pipeParts.length > 0) {
    name = pipeParts[0].trim()
  }

  // 2. Eliminar la palabra "yupoo" (case-insensitive)
  name = name.replace(/\byupoo\b/gi, '')

  // 3. Eliminar caracteres chinos (相册 = álbum)
  name = name.replace(/[\u4e00-\u9fff]+/g, '')

  // 4. Colapsar espacios múltiples
  name = name.replace(/\s{2,}/g, ' ').trim()

  // 5. Si quedó vacío o muy corto, retornar null
  if (name.length < 3) return null

  return name
}

/**
 * Limpia el nombre de una categoría de Yupoo.
 * Elimina emojis, "Yupoo No1 High Quality", etc.
 *
 * @param rawName - "👜 GUCCI Bag/Wallet/Handbags Yupoo No1 High Quality"
 * @returns "GUCCI Bag/Wallet/Handbags"
 */
export function cleanCategoryName(rawName: string): string {
  if (!rawName) return ''

  let name = rawName.trim()

  // Eliminar emojis (cualquier caracter fuera de BMP + pictográficos)
  name = name.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '')

  // Eliminar sufijos comunes de Yupoo
  name = name
    .replace(/\bYupoo\s*No\.?\s*1\s*(High|Best|Top)\s*(Version\s*)?Quality\b/gi, '')
    .replace(/\bYupoo\s*Top\s*Quality\b/gi, '')
    .replace(/\bYupoo\s*Best\s*No\.?\s*1\s*High\s*Quality\b/gi, '')
    .replace(/\bYupoo\b/gi, '')
    .replace(/\bNo\.?\s*1\s*High\s*Quality\b/gi, '')
    .replace(/\bBest\s*PK\s*Quality\b/gi, '')
    .replace(/\b1:1\s*Original\s*Quality\b/gi, '1:1')

  // Colapsar espacios y limpiar bordes
  name = name.replace(/\s{2,}/g, ' ').replace(/[\/\s]+$/, '').trim()

  return name
}

// ============================================================================
// CONSTRUCCIÓN DE URLs
// ============================================================================

/**
 * Construye la URL de un álbum individual.
 * @param albumId - ID numérico del álbum
 * @returns URL completa
 */
export function buildAlbumUrl(albumId: string): string {
  return `https://paypalshop.x.yupoo.com/albums/${albumId}`
}

/**
 * Construye la URL de una categoría.
 * @param categoryId - ID numérico de la categoría
 * @param page - Número de página (opcional, default 1)
 * @returns URL completa
 */
export function buildCategoryUrl(categoryId: string, page: number = 1): string {
  const base = `https://paypalshop.x.yupoo.com/categories/${categoryId}`
  return page > 1 ? `${base}?page=${page}` : base
}

/**
 * Construye la URL de la imagen original en Yupoo (CDN directo).
 * NO usar en frontend — solo para diagnóstico.
 * @param hash - Hash de la imagen
 * @param size - Tamaño deseado
 * @returns URL en photo.yupoo.com
 */
export function buildYupooImageUrl(hash: string, size: string = 'big'): string {
  return `https://photo.yupoo.com/paypalshop/${hash}/${size}.jpg`
}

// ============================================================================
// EXTRACCIÓN DE IDs
// ============================================================================

/**
 * Extrae el ID de un álbum desde una URL.
 * @param url - URL como https://paypalshop.x.yupoo.com/albums/192510415
 * @returns ID "192510415" o null si no se pudo extraer
 */
export function extractAlbumId(url: string): string | null {
  if (!url) return null
  const match = url.match(/\/albums\/(\d+)/)
  return match ? match[1] : null
}

/**
 * Extrae el ID de una categoría desde una URL.
 * @param url - URL como https://paypalshop.x.yupoo.com/categories/3478225
 * @returns ID "3478225" o null
 */
export function extractCategoryId(url: string): string | null {
  if (!url) return null
  const match = url.match(/\/categories\/(\d+)/)
  return match ? match[1] : null
}

/**
 * Extrae el hash de una URL de imagen de Yupoo.
 * @param url - URL como https://photo.yupoo.com/paypalshop/ab12cd34/big.jpg
 * @returns hash "ab12cd34" o null
 */
export function extractHash(url: string): string | null {
  if (!url) return null
  const match = url.match(/paypalshop\/([a-f0-9]{8,16})/i)
  return match ? match[1] : null
}

// ============================================================================
// CONVERSIONES DE TIPOS
// ============================================================================

/**
 * Convierte un YupooAlbum scrapeado a ScrapedProduct
 * listo para guardar en data/products.json.
 *
 * Esta función NO hace ninguna transformación de IA.
 * Solo reorganiza los datos del álbum en el formato final.
 *
 * @param album - Álbum scrapeado completo
 * @returns ScrapedProduct listo para persistir
 */
export function toScrapedProduct(album: YupooAlbum): ScrapedProduct {
  const imageHashes = album.images.map((img) => img.hash)
  const galleryProxyUrls = album.images.map((img) => img.proxyUrl)
  const mainImageProxyUrl = galleryProxyUrls[0] || ''
  const videoUrls = album.videos.map((v) => v.url)

  return {
    sku: `YP-${album.id}`,
    yupooAlbumId: album.id,
    yupooUrl: album.url,
    name: album.name,
    description: album.description,
    yupooCategoryId: album.categoryId,
    yupooCategoryName: album.categoryName,
    imageHashes,
    mainImageProxyUrl,
    galleryProxyUrls,
    videoUrls,
    priceRaw: album.priceRaw,
    scrapedAt: album.scrapedAt,
  }
}

/**
 * Construye un objeto YupooImage completo desde un hash.
 *
 * @param hash - Hash de la imagen
 * @param order - Posición en el álbum (0-based)
 * @param filename - Nombre del archivo opcional
 * @returns Objeto YupooImage
 */
export function buildYupooImage(
  hash: string,
  order: number,
  filename?: string
): YupooImage {
  return {
    hash,
    size: 'big', // tamaño por defecto para el proxy
    proxyUrl: buildProxyUrl(hash, 'big'),
    sourceUrl: buildYupooImageUrl(hash, 'big'),
    filename,
    order,
  }
}

// ============================================================================
// VALIDACIONES
// ============================================================================

/**
 * Valida que un álbum scrapeado tenga los datos mínimos.
 * @param album - Álbum a validar
 * @returns true si tiene nombre y al menos 1 imagen
 */
export function isValidAlbum(album: YupooAlbum): boolean {
  return (
    album.exists &&
    album.name.length > 0 &&
    album.images.length > 0 &&
    isValidAlbumId(album.id)
  )
}

/**
 * Valida que una categoría sea correcta.
 */
export function isValidCategory(cat: { id: string; name: string }): boolean {
  return isValidCategoryId(cat.id) && cat.name.length > 0
}

// ============================================================================
// DEDUPLICACIÓN
// ============================================================================

/**
 * Elimina hashes duplicados manteniendo el orden.
 * @param hashes - Array de hashes
 * @returns Array sin duplicados
 */
export function dedupeHashes(hashes: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const h of hashes) {
    if (isValidHash(h) && !seen.has(h)) {
      seen.add(h)
      result.push(h)
    }
  }
  return result
}

/**
 * Elimina álbumes duplicados por ID.
 * @param albums - Array de álbumes
 * @returns Array sin duplicados
 */
export function dedupeAlbumsById<T extends { id: string }>(albums: T[]): T[] {
  const seen = new Set<string>()
  const result: T[] = []
  for (const a of albums) {
    if (!seen.has(a.id)) {
      seen.add(a.id)
      result.push(a)
    }
  }
  return result
}

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Logger simple con prefijo [Yupoo].
 * Usa console con timestamps para debugging.
 */
export const logger = {
  info: (msg: string, ...args: unknown[]) =>
    console.log(`[${timestamp()}] [Yupoo:INFO] ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) =>
    console.warn(`[${timestamp()}] [Yupoo:WARN] ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) =>
    console.error(`[${timestamp()}] [Yupoo:ERROR] ${msg}`, ...args),
  debug: (msg: string, ...args: unknown[]) => {
    if (process.env.YUPOO_DEBUG === '1') {
      console.debug(`[${timestamp()}] [Yupoo:DEBUG] ${msg}`, ...args)
    }
  },
}

function timestamp(): string {
  return new Date().toISOString().substring(11, 19) // HH:MM:SS
}

// ============================================================================
// ESTADÍSTICAS
// ============================================================================

/**
 * Calcula estadísticas resumidas de un array de productos scrapeados.
 * Útil para mostrar en el informe final.
 */
export function calculateStats(products: ScrapedProduct[]): {
  total: number
  withImages: number
  withVideos: number
  withDescription: number
  avgImagesPerProduct: number
  totalImages: number
  totalVideos: number
} {
  const total = products.length
  const withImages = products.filter((p) => p.imageHashes.length > 0).length
  const withVideos = products.filter((p) => p.videoUrls.length > 0).length
  const withDescription = products.filter((p) => p.description).length
  const totalImages = products.reduce((sum, p) => sum + p.imageHashes.length, 0)
  const totalVideos = products.reduce((sum, p) => sum + p.videoUrls.length, 0)

  return {
    total,
    withImages,
    withVideos,
    withDescription,
    avgImagesPerProduct: total > 0 ? Math.round((totalImages / total) * 10) / 10 : 0,
    totalImages,
    totalVideos,
  }
}
