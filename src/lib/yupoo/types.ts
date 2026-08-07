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

import type { YupooImageSize } from './config'

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
 * Ejemplo:
 *   {
 *     id: "192510415",
 *     url: "https://paypalshop.x.yupoo.com/albums/192510415",
 *     categoryId: "3787147",
 *     thumbnailHash: "cd7d8bf4",  // hash de la miniatura en el listado
 *     pageNumber: 1
 *   }
 */
export interface YupooAlbumRef {
  /** ID numérico del álbum en Yupoo */
  id: string
  /** URL completa del álbum individual */
  url: string
  /** ID de la categoría donde se encontró */
  categoryId: string
  /** Hash de la imagen thumbnail mostrada en el listado (opcional) */
  thumbnailHash?: string
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
  /** URL completa del álbum */
  url: string
  /** Nombre original extraído del HTML (title o h1) */
  name: string
  /** Descripción extraída del HTML si existe */
  description: string | null
  /** ID de la categoría a la que pertenece */
  categoryId: string
  /** Nombre de la categoría (para referencia) */
  categoryName: string | null
  /** Lista de imágenes extraídas (ordenadas por posición en el DOM) */
  images: YupooImage[]
  /** Lista de videos extraídos si los hay */
  videos: YupooVideo[]
  /** Precio si está visible en el álbum (string, formato original) */
  priceRaw: string | null
  /** Fecha de scrapeo ISO */
  scrapedAt: string
  /** Indica si el álbum existe (false si Yupoo devolvió 404) */
  exists: boolean
}

// ============================================================================
// ENTIDAD FINAL (Output para data/products.json)
// ============================================================================

/**
 * Producto scrapeado listo para guardar en data/products.json.
 *
 * Esta es la estructura final que se persiste en disco.
 * Es una versión "limpia" de YupooAlbum, optimizada para
 * posterior importación a Prisma (en una fase futura).
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
  /** URL del proxy de la imagen principal (primera) */
  mainImageProxyUrl: string
  /** Lista de URLs del proxy para la galería */
  galleryProxyUrls: string[]
  /** Lista de URLs de videos si los hay */
  videoUrls: string[]

  // === Metadata ===
  /** Precio crudo si estaba visible */
  priceRaw: string | null
  /** Fecha de scrapeo ISO */
  scrapedAt: string
}

/**
 * Estructura del archivo data/products.json.
 * Contiene metadata del scraping + array de productos.
 */
export interface ProductsJsonFile {
  /** Metadata del scraping */
  metadata: {
    /** Versión del esquema del JSON */
    schemaVersion: 1
    /** Fecha de inicio del scraping */
    startedAt: string
    /** Fecha de finalización (null si aún en progreso) */
    finishedAt: string | null
    /** Total de productos en el archivo */
    totalProducts: number
    /** Total de categorías scrapeadas */
    totalCategories: number
    /** Fuente del scraping */
    source: string
    /** Versión del módulo Yupoo */
    moduleVersion: string
  }
  /** Array de productos scrapeados */
  products: ScrapedProduct[]
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
