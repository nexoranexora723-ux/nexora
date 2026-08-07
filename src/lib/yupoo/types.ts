/**
 * NEXORA — Yupoo Importer · Tipos TypeScript
 * ============================================
 *
 * Módulo: src/lib/yupoo/types.ts
 *
 * RESPONSABILIDAD
 * ---------------
 * Definir TODOS los tipos TypeScript del módulo Yupoo.
 * Ningún otro archivo del módulo debe declarar tipos sueltos —
 * todo debe estar centralizado aquí.
 *
 * JERARQUÍA DE TIPOS
 * ------------------
 *   YupooCategory (descubrimiento)
 *     → YupooAlbumRef (referencia a un álbum encontrado)
 *       → YupooAlbum (álbum scrapeado completo)
 *         → YupooImage
 *         → YupooVideo
 *           → ScrapedProduct (producto final para products.json)
 *
 * FLUJO DE DATOS
 * --------------
 *   scanner.scanCategories()
 *     → YupooCategory[]
 *   scanner.scanAlbumsFromCategory(cat)
 *     → YupooAlbumRef[]
 *   parser.parseAlbum(albumRef)
 *     → YupooAlbum (con imágenes, videos, nombre, descripción)
 *   utils.toScrapedProduct(album)
 *     → ScrapedProduct (lista para guardar en data/products.json)
 */

import type { YupooImageSize, ImageMode, FetchStrategy } from './config'

// ============================================================================
// ENTIDADES DE DESCUBRIMIENTO (Scanner)
// ============================================================================

/**
 * Una categoría de Yupoo encontrada en la homepage.
 * Las categorías agrupan álbumes por marca/tipo de producto.
 *
 * Ejemplo:
 *   {
 *     id: "3478225",
 *     name: "Gucci Bag/Wallet/Handbags",
 *     url: "https://paypalshop.x.yupoo.com/categories/3478225",
 *     albumCount: 1700  // se llena al scrapear
 *   }
 */
export interface YupooCategory {
  /** ID numérico de la categoría en Yupoo */
  id: string
  /** Nombre visible (limpio, sin emojis ni "Yupoo No1 High Quality") */
  name: string
  /** URL completa de la categoría */
  url: string
  /** Número de álbumes descubiertos (se actualiza al scrapear) */
  albumCount: number
  /** Fecha de descubrimiento ISO */
  discoveredAt: string
}

/**
 * Referencia a un álbum encontrada en una página de categoría.
 * NO contiene datos del álbum — solo su ID y dónde se encontró.
 *
 * Esta referencia es lo que el parser usará para visitar el álbum
 * individual y extraer su contenido completo.
 *
 * CAMPOS OBLIGATORIOS (extraídos del DOM, nunca construidos manualmente):
 * - href: href EXACTO del enlace <a> en el listado de categoría
 * - url: URL completa (href + base) lista para navegar
 * - title: atributo title del <a> (nombre original del producto)
 * - id: ID numérico extraído del href
 * - categoryId: ID de la categoría donde se encontró
 *
 * CAMPOS OPCIONALES (extraídos del card del álbum):
 * - thumbnailHash: hash de la imagen thumbnail
 * - photoCount: número de fotos mostrado en la tarjeta
 *
 * Ejemplo:
 *   {
 *     id: "182425674",
 *     href: "/albums/182425674?uid=1&isSubCate=false&referrercate=3478225",
 *     url: "https://paypalshop.x.yupoo.com/albums/182425674?uid=1&isSubCate=false&referrercate=3478225",
 *     title: "Gucci bags yupoo Gucci tote bag(D6B3)",
 *     categoryId: "3478225",
 *     thumbnailHash: "780e18d4",
 *     photoCount: 10,
 *     pageNumber: 1
 *   }
 */
export interface YupooAlbumRef {
  /** ID numérico del álbum extraído del href */
  id: string
  /** href EXACTO del DOM (relativo, ej: /albums/182425674?uid=1&isSubCate=false&referrercate=3478225) */
  href: string
  /** URL completa lista para navegar (base + href) */
  url: string
  /** Atributo title del <a> — nombre original del producto */
  title: string
  /** ID de la categoría donde se encontró */
  categoryId: string
  /** Hash de la imagen thumbnail mostrada en el listado */
  thumbnailHash: string | null
  /** Número de fotos mostrado en la tarjeta (.album__photonumber) */
  photoCount: number | null
  /** Número de página donde se descubrió (1-based) */
  pageNumber: number
  /** Fecha de descubrimiento ISO */
  discoveredAt: string
}

// ============================================================================
// ENTIDADES DE EXTRACCIÓN (Parser)
// ============================================================================

/**
 * Una imagen extraída de un álbum de Yupoo.
 *
 * Cada álbum contiene múltiples imágenes. Cada imagen tiene un
 * hash único que identifica el archivo en el CDN de Yupoo.
 *
 * La URL del proxy se construye como:
 *   /api/yupoo-img/{hash}/{size}
 *
 * Esto permite servir las imágenes en producción sin exponer
 * el CDN de Yupoo directamente y con cache del lado del servidor.
 */
export interface YupooImage {
  /** Hash único del archivo en el CDN de Yupoo */
  hash: string
  /** Tamaño original detectado en el HTML (small|medium|big|square|custom) */
  size: YupooImageSize
  /** URL del proxy interna para servir en NEXORA: /api/yupoo-img/{hash}/{size} */
  proxyUrl: string
  /** URL original en Yupoo (para diagnóstico, NO usar en frontend) */
  sourceUrl: string
  /** Nombre del archivo si está disponible (ej: "i1740254981_9722_0.jpg") */
  filename?: string
  /** Posición en el álbum (0-based, orden del DOM) */
  order: number
}

/**
 * Un video extraído de un álbum de Yupoo.
 *
 * Algunos álbumes incluyen videos (.mp4) además de imágenes.
 * Los videos se almacenan en el mismo CDN que las imágenes.
 */
export interface YupooVideo {
  /** URL directa del video en Yupoo */
  url: string
  /** Hash del video si se puede extraer (mismo formato que imágenes) */
  hash?: string
  /** Nombre del archivo (ej: "video_001.mp4") */
  filename?: string
  /** Duración en segundos si está disponible */
  duration?: number
  /** Posición en el álbum */
  order: number
}

/**
 * Un álbum de Yupoo completamente parseado.
 *
 * Cada álbum representa EXACTAMENTE UN producto.
 * Contiene: nombre, descripción, categoría, todas las imágenes y videos.
 *
 * Toda la información proviene del HTML del álbum — no se usa IA,
 * no se inventan nombres, no se hace OCR, no se usa visión artificial.
 */
export interface YupooAlbum {
  /** ID numérico del álbum en Yupoo */
  id: string
  /** URL completa del álbum (href exacto del DOM, nunca reconstruido) */
  url: string
  /** href exacto del DOM (relativo) */
  href: string
  /** Nombre original del producto — del atributo title del <a> en el card */
  title: string
  /** Nombre limpio extraído del title o h1 (sin "yupoo", sin sufijos) */
  name: string
  /** Descripción extraída del HTML si existe */
  description: string | null
  /** ID de la categoría a la que pertenece */
  categoryId: string
  /** Nombre de la categoría (para referencia) */
  categoryName: string | null
  /** Número de fotos mostrado en la tarjeta del listado */
  photoCount: number | null
  /** Hash de la thumbnail del listado */
  thumbnailHash: string | null
  /** Lista de imágenes extraídas (ordenadas por posición en el DOM) */
  images: YupooImage[]
  /** Lista de videos extraídos si los hay */
  videos: YupooVideo[]
  /** Precio si está visible en el álbum (string, formato original) */
  priceRaw: string | null
  /** Método de fetch usado: 'http' o 'playwright' */
  fetchMethod: 'http' | 'playwright'
  /** Fecha de scrapeo ISO */
  scrapedAt: string
  /** Indica si el álbum existe (false si Yupoo devolvió 404) */
  exists: boolean
}

// ============================================================================
// ENTIDAD FINAL (Output para data/products/{numero}.json)
// ============================================================================

/**
 * Producto scrapeado listo para guardar en data/products/{numero}.json.
 *
 * Cada producto se guarda en su propio archivo individual para:
 * - Reanudación granular
 * - Procesamiento incremental
 * - No recargar todo en memoria
 *
 * NO se incluye lógica de Prisma aquí — solo datos serializables.
 */
export interface ScrapedProduct {
  // === Identificación ===
  /** SKU único: YP-{albumId} */
  sku: string
  /** ID del álbum en Yupoo */
  yupooAlbumId: string
  /** URL del álbum original */
  yupooUrl: string

  // === Contenido (extraído del HTML, sin IA) ===
  /** Nombre original del álbum */
  name: string
  /** Descripción original si existe */
  description: string | null
  /** ID de categoría Yupoo */
  yupooCategoryId: string
  /** Nombre de categoría Yupoo */
  yupooCategoryName: string | null

  // === Multimedia ===
  /** Lista de hashes de imágenes (ordenados) */
  imageHashes: string[]
  /** URL de la imagen principal (formato depende de imageMode) */
  mainImageUrl: string
  /** Lista de URLs para la galería (formato depende de imageMode) */
  galleryUrls: string[]
  /** Lista de URLs de videos si los hay */
  videoUrls: string[]

  // === Metadata ===
  /** Precio crudo si estaba visible */
  priceRaw: string | null
  /** Modo de imagen usado: 'proxy' o 'local' */
  imageMode: ImageMode
  /** Hash SHA-256 del álbum (para detección de cambios) */
  albumHash: string
  /** Fecha de scrapeo ISO */
  scrapedAt: string
}

// ============================================================================
// ÍNDICE DE PRODUCTOS (data/products/index.json)
// ============================================================================

/**
 * Entrada individual en el índice de productos.
 * NO contiene el producto completo, solo metadatos.
 */
export interface ProductIndexEntry {
  /** SKU del producto: YP-{albumId} */
  sku: string
  /** ID del álbum en Yupoo */
  albumId: string
  /** Nombre del archivo: 000001.json */
  file: string
  /** Hash SHA-256 del álbum (para detectar cambios) */
  hash: string
  /** Nombre del producto (para búsqueda rápida) */
  name: string
  /** Categoría Yupoo */
  categoryId: string
  /** Número de imágenes */
  imageCount: number
  /** Fecha de creación ISO */
  createdAt: string
}

/**
 * Estructura del archivo index.json.
 * Contiene metadatos de TODOS los productos sin el contenido completo.
 * Permite saber qué productos existen sin leer cada archivo individual.
 */
export interface ProductIndex {
  /** Versión del esquema */
  schemaVersion: 1
  /** Fecha de última actualización */
  updatedAt: string
  /** Total de productos indexados */
  total: number
  /** Lista de entradas del índice */
  entries: ProductIndexEntry[]
}

// ============================================================================
// CACHÉ DE ÁLBUMES (cache/{albumId}.json)
// ============================================================================

/**
 * Entrada de caché para un álbum procesado.
 * Se guarda en cache/{albumId}.json después de cada parseAlbum exitoso.
 *
 * Si el álbum no cambia (hash igual), se puede saltar el re-procesamiento.
 */
export interface AlbumCacheEntry {
  /** ID del álbum */
  albumId: string
  /** Hash SHA-256 del contenido (name + description + imageHashes) */
  contentHash: string
  /** Fecha de procesamiento ISO */
  processedAt: string
  /** Método usado para extraer: 'http' o 'playwright' */
  fetchMethod: 'http' | 'playwright'
  /** Número de imágenes encontradas */
  imageCount: number
  /** Número de videos encontrados */
  videoCount: number
  /** Nombre del álbum (para referencia) */
  albumName: string
  /** Archivo de producto generado (ej: 000001.json) o null si falló */
  productFile: string | null
}

// ============================================================================
// PRODUCTOS FALLIDOS (data/failed.json — FASE 2.5 Validation)
// ============================================================================

/**
 * Producto que falló la validación de FASE 2.5.
 * Se guarda en data/failed.json para revisión manual.
 */
export interface FailedProduct {
  /** SKU generado: YP-{albumId} */
  sku: string
  /** ID del álbum */
  albumId: string
  /** URL del álbum */
  url: string
  /** Nombre extraído (puede estar vacío) */
  name: string | null
  /** Lista de errores de validación */
  errors: ValidationError[]
  /** Fecha del intento ISO */
  failedAt: string
  /** Datos parciales extraídos (para debug) */
  partialData: {
    imageCount: number
    videoCount: number
    hasDescription: boolean
    categoryId: string | null
  }
}

/**
 * Error de validación tipado.
 */
export interface ValidationError {
  /** Tipo de error */
  type:
    | 'MISSING_NAME'
    | 'MISSING_IMAGES'
    | 'INVALID_CATEGORY'
    | 'INVALID_URL'
    | 'ALBUM_NOT_FOUND'
    | 'PARSE_ERROR'
  /** Mensaje descriptivo */
  message: string
  /** Valor problemático (si aplica) */
  value?: string
}

/**
 * Resultado de la validación de un producto.
 */
export interface ValidationResult {
  /** true si el producto es válido */
  valid: boolean
  /** Lista de errores (vacía si es válido) */
  errors: ValidationError[]
  /** Producto validado (solo si valid=true) */
  product: ScrapedProduct | null
}

// ============================================================================
// ESTADO DE SCRAPING (Resumabilidad)
// ============================================================================

/**
 * Estado persistente del scraper para resumir si se interrumpe.
 * Se guarda en data/.scrape-state.json después de cada álbum.
 */
export interface ScrapeState {
  /** Última categoría procesada (índice) */
  lastCategoryIndex: number
  /** Último álbum procesado (ID) */
  lastAlbumId: string | null
  /** Total de álbumes procesados */
  totalProcessed: number
  /** Total de álbumes exitosos */
  totalSuccess: number
  /** Total de álbumes fallidos (no existen, errores) */
  totalFailed: number
  /** Timestamp del último procesamiento */
  lastUpdate: string

  // === Campos FASE A (usados EXCLUSIVAMENTE por Resume/Dashboard) ===
  // Estos campos NO son utilizados por la lógica de extracción.
  // Solo los leen/escriben el sistema Resume y el Progress Dashboard.

  /** Índice de categoría inicial del batch actual */
  startCategoryIndex?: number
  /** Índice de categoría final del batch actual */
  endCategoryIndex?: number
  /** Tamaño del batch (número de categorías en este lote) */
  batchSize?: number
  /** Índice del álbum actual dentro de la categoría (para resume granular) */
  currentAlbumIndex?: number
  /** Total de álbumes en el batch actual */
  totalAlbumsInBatch?: number
  /** Porcentaje completado (0-100) — calculado por Dashboard */
  percentComplete?: number
  /** Tiempo transcurrido en segundos — calculado por Dashboard */
  elapsedSeconds?: number
  /** Timestamp de inicio del scraping (ISO) */
  startedAt?: string
}

// ============================================================================
// RESULTADOS Y ERRORES
// ============================================================================

/**
 * Resultado de scrapear una categoría.
 */
export interface CategoryScanResult {
  category: YupooCategory
  albums: YupooAlbumRef[]
  pagesScraped: number
  success: boolean
  error?: string
}

/**
 * Resultado de parsear un álbum individual.
 */
export interface AlbumParseResult {
  album: YupooAlbum | null
  success: boolean
  error?: string
  /** Tiempo que tomó en ms */
  durationMs: number
}

/**
 * Errores tipados del módulo Yupoo.
 */
export type YupooErrorType =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'ALBUM_NOT_FOUND'
  | 'PARSE_ERROR'
  | 'RATE_LIMITED'
  | 'INVALID_URL'
  | 'BROWSER_ERROR'
  | 'UNKNOWN'

/**
 * Error tipado del módulo Yupoo.
 */
export class YupooError extends Error {
  constructor(
    public type: YupooErrorType,
    message: string,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'YupooError'
  }
}

// ============================================================================
// OPCIONES DE CONFIGURACIÓN (para el scraper)
// ============================================================================

/**
 * Opciones para ejecutar el scraper completo.
 * Se pasan a la función principal del módulo.
 */
export interface ScrapeOptions {
  /** Índice de categoría inicial (para resumir) */
  startCategoryIndex?: number
  /** Máximo de categorías a procesar (null = todas) */
  maxCategories?: number | null
  /** Máximo de álbumes por categoría (null = todos) */
  maxAlbumsPerCategory?: number | null
  /** Si reanudar desde el estado guardado */
  resume?: boolean
  /** Si guardar estado cada N álbumes */
  checkpointEvery?: number
  /** Estrategia de fetching: 'http-first' | 'playwright-only' | 'http-only' */
  fetchStrategy?: FetchStrategy
  /** Modo de imagen: 'proxy' | 'local' */
  imageMode?: ImageMode
  /** Si usar caché (saltar álbumes sin cambios) */
  useCache?: boolean
  /** Si ejecutar validación FASE 2.5 */
  validate?: boolean
  /** Callback de progreso (se llama después de cada álbum) */
  onProgress?: (progress: ScrapeProgress) => void
}

/**
 * Información de progreso del scraping.
 */
export interface ScrapeProgress {
  /** Categoría actual (índice 0-based) */
  currentCategoryIndex: number
  /** Total de categorías */
  totalCategories: number
  /** Álbum actual dentro de la categoría */
  currentAlbumInCategory: number
  /** Total de álbumes en la categoría actual */
  totalAlbumsInCategory: number
  /** Álbumes procesados en total */
  totalProcessed: number
  /** Álbumes exitosos */
  totalSuccess: number
  /** Porcentaje completado (0-100) */
  percentComplete: number
  /** Tiempo transcurrido en segundos */
  elapsedSeconds: number
  /** Álbum actual siendo procesado */
  currentAlbum: YupooAlbumRef | null
}
