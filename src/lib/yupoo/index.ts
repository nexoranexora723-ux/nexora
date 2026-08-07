/**
 * NEXORA — Yupoo Importer · Barrel (Punto de entrada)
 * ======================================================
 *
 * Módulo: src/lib/yupoo/index.ts
 *
 * RESPONSABILIDAD
 * ---------------
 * Centralizar las exportaciones del módulo Yupoo.
 * Cualquier consumidor externo debe importar desde '@/lib/yupoo'
 * (no desde archivos individuales).
 *
 * USO
 * ---
 * ```ts
 * // ✅ Correcto
 * import { scanCategories, parseAlbum, type YupooAlbum } from '@/lib/yupoo'
 *
 * // ❌ Incorrecto (no acceder a archivos internos directamente)
 * import { scanCategories } from '@/lib/yupoo/scanner'
 * ```
 */

// ============================================================================
// CONFIGURACIÓN
// ============================================================================
export {
  YUPOO_BASE_URL,
  YUPOO_ALBUMS_PATH,
  YUPOO_CDN_HOST,
  YUPOO_CDN_SUPPLIER,
  YUPOO_IMAGE_SIZES,
  YUPOO_DEFAULT_HEADERS,
  PLAYWRIGHT_CONFIG,
  PAGE_LOAD_TIMEOUT_MS,
  POST_LOAD_DELAY_MS,
  INTER_ALBUM_DELAY_MS,
  INTER_CATEGORY_DELAY_MS,
  MAX_PAGES_PER_CATEGORY,
  ALBUMS_PER_PAGE_THRESHOLD,
  CONCURRENT_ALBUMS,
  MAX_IMAGES_PER_ALBUM,
  MAX_VIDEOS_PER_ALBUM,
  OUTPUT_DIR,
  OUTPUT_FILE,
  STATE_FILE,
  IMAGE_PROXY_PATH,
  HASH_REGEX,
  ALBUM_ID_REGEX,
  CATEGORY_ID_REGEX,
  buildProxyUrl,
  isValidHash,
  isValidAlbumId,
  isValidCategoryId,
  type YupooImageSize,
} from './config'

// ============================================================================
// TIPOS
// ============================================================================
export type {
  YupooCategory,
  YupooAlbumRef,
  YupooImage,
  YupooVideo,
  YupooAlbum,
  ScrapedProduct,
  ProductsJsonFile,
  ScrapeState,
  CategoryScanResult,
  AlbumParseResult,
  ScrapeOptions,
  ScrapeProgress,
  YupooErrorType,
} from './types'

export { YupooError } from './types'

// ============================================================================
// UTILIDADES
// ============================================================================
export {
  cleanAlbumName,
  cleanCategoryName,
  buildAlbumUrl,
  buildCategoryUrl,
  buildYupooImageUrl,
  extractAlbumId,
  extractCategoryId,
  extractHash,
  toScrapedProduct,
  buildYupooImage,
  isValidAlbum,
  isValidCategory,
  dedupeHashes,
  dedupeAlbumsById,
  logger,
  calculateStats,
} from './utils'

// ============================================================================
// SCANNER (Descubrimiento)
// ============================================================================
export {
  scanCategories,
  scanAlbumsFromCategory,
  scanAll,
} from './scanner'

// ============================================================================
// PARSER (Extracción)
// ============================================================================
export {
  parseAlbum,
  parseAlbumsBatch,
} from './parser'

// ============================================================================
// METADATOS DEL MÓDULO
// ============================================================================
export const MODULE_NAME = 'yupoo-importer' as const
export const MODULE_VERSION = '1.0.0' as const
export const MODULE_DESCRIPTION = 'Importador profesional de catálogos Yupoo para NEXORA' as const
