/**
 * NEXORA — Yupoo Importer · Barrel (Punto de entrada)
 * ======================================================
 *
 * Módulo: src/lib/yupoo/index.ts
 *
 * Cualquier consumidor externo debe importar desde '@/lib/yupoo'.
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
  DATA_DIR,
  PRODUCTS_DIR,
  INDEX_FILE,
  FAILED_FILE,
  STATE_FILE,
  PRODUCT_FILE_PADDING,
  CACHE_DIR,
  LOCAL_IMAGES_DIR,
  HTTP_TIMEOUT_MS,
  PLAYWRIGHT_TIMEOUT_MS,
  HTTP_MAX_RETRIES,
  HASH_ALGORITHM,
  IMAGE_PROXY_PATH,
  HASH_REGEX,
  ALBUM_ID_REGEX,
  CATEGORY_ID_REGEX,
  buildProxyUrl,
  isValidHash,
  isValidAlbumId,
  isValidCategoryId,
  type YupooImageSize,
  type ImageMode,
  type FetchStrategy,
} from './config'

export {
  DEFAULT_IMAGE_MODE,
  DEFAULT_FETCH_STRATEGY,
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
  ProductIndex,
  ProductIndexEntry,
  AlbumCacheEntry,
  FailedProduct,
  ValidationError,
  ValidationResult,
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
// HASHING
// ============================================================================
export {
  computeAlbumHash,
  hashString,
  albumChanged,
} from './hash'

// ============================================================================
// CACHÉ
// ============================================================================
export {
  ensureCacheDir,
  getAlbumCache,
  setAlbumCache,
  isAlbumCached,
  hasAlbumCache,
  clearAlbumCache,
  countCachedAlbums,
  listCachedAlbumIds,
} from './cache'

// ============================================================================
// STORAGE (Productos divididos)
// ============================================================================
export {
  ensureDirs,
  productFileName,
  productFilePath,
  saveProduct,
  loadProduct,
  loadProductByName,
  countProducts,
  getNextProductNumber,
  loadIndex,
  saveIndex,
  upsertIndexEntry,
  findInIndex,
  loadFailed,
  saveFailed,
  addFailedProduct,
  countFailed,
  getStorageStats,
  loadState,
  saveState,
} from './storage'

// ============================================================================
// VALIDACIÓN (FASE 2.5)
// ============================================================================
export {
  validateAlbum,
  recordFailedAlbum,
  recordParseFailure,
  createEmptyAlbum,
} from './validation'

// ============================================================================
// FETCHER (Híbrido HTTP + Playwright)
// ============================================================================
export {
  fetchHtml,
  fetchHtmlWithPlaywright,
  fetchPage,
  loadHtml,
  hasAlbumContent,
  hasCategoryContent,
  isAlbumNotFound,
  closeBrowser,
  type FetchResult,
} from './fetcher'

// ============================================================================
// SCANNER (Descubrimiento)
// ============================================================================
export {
  scanCategories,
  scanAlbumsFromCategory,
  scanAll,
  isValidAlbumHref,
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
export const MODULE_VERSION = '2.0.0' as const
export const MODULE_DESCRIPTION = 'Importador profesional híbrido de catálogos Yupoo para NEXORA' as const
