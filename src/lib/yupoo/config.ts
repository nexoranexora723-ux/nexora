/**
 * NEXORA — Yupoo Importer · Configuración central
 * ==================================================
 *
 * Módulo: src/lib/yupoo/config.ts
 *
 * RESPONSABILIDAD
 * ---------------
 * Centralizar TODAS las constantes y parámetros de configuración
 * del importador de Yupoo. Ningún otro archivo del módulo debe
 * contener valores hardcoded (URLs, timeouts, límites, etc.).
 *
 * PRINCIPIOS
 * ----------
 * - Una sola fuente de verdad para configuración
 * - Fácil de ajustar sin tocar lógica de scraper/parser
 * - Valores inmutables (const) — no hay estado mutable aquí
 * - Sin efectos secundarios (pure module)
 *
 * NO TOCA
 * -------
 * - Prisma, DB, APIs existentes, frontend
 */

// ============================================================================
// SITIO FUENTE (Source)
// ============================================================================

/**
 * URL base del sitio Yupoo que vamos a scrapear.
 * Este es el "supplier catalog" de paypalshop.
 */
export const YUPOO_BASE_URL = 'https://paypalshop.x.yupoo.com' as const

/**
 * Path de la página principal de álbumes (catálogo raíz).
 * Desde aquí se descubren todas las categorías.
 */
export const YUPOO_ALBUMS_PATH = '/albums' as const

/**
 * Host donde Yupoo almacena las imágenes (CDN).
 * Las URLs tienen el formato:
 *   https://photo.yupoo.com/paypalshop/{hash}/{size}.jpg
 */
export const YUPOO_CDN_HOST = 'photo.yupoo.com' as const

/**
 * Sub-path dentro del CDN para el proveedor paypalshop.
 */
export const YUPOO_CDN_SUPPLIER = 'paypalshop' as const

/**
 * Tamaños de imagen válidos que ofrece Yupoo.
 * - small  : thumbnails (~150px)
 * - medium : vista previa (~400px)
 * - big    : alta resolución (~1000px)
 * - square : thumbnail cuadrado
 * - custom : tamaño personalizado
 */
export const YUPOO_IMAGE_SIZES = ['small', 'medium', 'big', 'square', 'custom'] as const
export type YupooImageSize = (typeof YUPOO_IMAGE_SIZES)[number]

// ============================================================================
// HEADERS HTTP
// ============================================================================

/**
 * Headers por defecto para todas las requests HTTP hacia Yupoo.
 * Yupoo bloquea requests sin User-Agent válido o sin Referer.
 */
export const YUPOO_DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
  Referer: `${YUPOO_BASE_URL}${YUPOO_ALBUMS_PATH}`,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
} as const

// ============================================================================
// PLAYWRIGHT (Browser)
// ============================================================================

/**
 * Configuración del browser de Playwright.
 * Headless para no abrir ventana gráfica.
 */
export const PLAYWRIGHT_CONFIG = {
  headless: true,
  locale: 'es-ES',
  viewport: { width: 1280, height: 800 },
  userAgent: YUPOO_DEFAULT_HEADERS['User-Agent'],
} as const

/**
 * Tiempo de espera (ms) para que la página cargue completamente.
 * Yupoo carga imágenes con lazy-load, necesitamos esperar.
 */
export const PAGE_LOAD_TIMEOUT_MS = 30_000 as const

/**
 * Pausa adicional (ms) después de que la página carga,
 * para dar tiempo al JS de renderizar galerías.
 */
export const POST_LOAD_DELAY_MS = 2_000 as const

/**
 * Tiempo de espera entre álbumes (ms) para evitar rate-limiting.
 */
export const INTER_ALBUM_DELAY_MS = 800 as const

/**
 * Tiempo de espera entre categorías (ms).
 */
export const INTER_CATEGORY_DELAY_MS = 1_500 as const

// ============================================================================
// PAGINACIÓN
// ============================================================================

/**
 * Número máximo de páginas a scrapear por categoría.
 * Cada página tiene ~120 álbumes.
 * 50 páginas = ~6,000 álbumes por categoría.
 */
export const MAX_PAGES_PER_CATEGORY = 50 as const

/**
 * Cantidad típica de álbumes por página en Yupoo.
 * Si una página tiene menos, se asume que es la última.
 */
export const ALBUMS_PER_PAGE_THRESHOLD = 30 as const

// ============================================================================
// LÍMITES DE CONCURRENCIA
// ============================================================================

/**
 * Número de álbumes que se procesan en paralelo.
 * Alto = rápido pero más riesgo de rate-limit.
 * Bajo = lento pero más estable.
 */
export const CONCURRENT_ALBUMS = 3 as const

/**
 * Número máximo de imágenes a extraer por álbum.
 * Algunos álbumes tienen 50+ fotos; limitamos para no saturar.
 */
export const MAX_IMAGES_PER_ALBUM = 30 as const

/**
 * Número máximo de videos a extraer por álbum.
 */
export const MAX_VIDEOS_PER_ALBUM = 5 as const

// ============================================================================
// ALMACENAMIENTO (Output) — Productos divididos en archivos individuales
// ============================================================================

/**
 * Directorio raíz para todos los datos de salida.
 * NO se commitea a git (debe estar en .gitignore).
 */
export const DATA_DIR = 'data' as const

/**
 * Directorio donde se guardan los productos individuales.
 * Cada producto es un archivo JSON separado:
 *   data/products/000001.json
 *   data/products/000002.json
 *   ...
 *
 * Ventajas:
 * - Reanudación granular (saber exactamente cuál falta)
 * - Procesamiento incremental
 * - No recargar todo en memoria
 */
export const PRODUCTS_DIR = 'data/products' as const

/**
 * Archivo índice con metadatos de todos los productos.
 * Estructura: ProductIndex (ver types.ts)
 * Contiene: lista de { sku, albumId, file, hash } sin el contenido completo
 */
export const INDEX_FILE = 'data/products/index.json' as const

/**
 * Archivo con productos que fallaron validación (FASE 2.5).
 * Estructura: FailedProduct[] (ver types.ts)
 */
export const FAILED_FILE = 'data/failed.json' as const

/**
 * Archivo de estado para resumir el scraping si se interrumpe.
 * Guarda el último álbum procesado.
 */
export const STATE_FILE = 'data/.scrape-state.json' as const

/**
 * Número de dígitos para el nombre de archivo de producto.
 * Ej: 6 dígitos → 000001.json, 000002.json, ... hasta 999999
 */
export const PRODUCT_FILE_PADDING = 6 as const

// ============================================================================
// PROXY DE IMÁGENES (Existente en NEXORA)
// ============================================================================

/**
 * El proyecto YA TIENE un proxy de imágenes en:
 *   /api/yupoo-img/[hash]/[size]/route.ts
 *
 * Este proxy resuelve imágenes desde Yupoo con headers correctos
 * (Referer, User-Agent) y cachea en memoria.
 *
 * Las URLs de imágenes se construyen como:
 *   /api/yupoo-img/{hash}/{size}
 *
 * En FASE 3 (cuando guardemos a products.json) usaremos estas URLs
 * para que las imágenes funcionen en producción sin exponer el CDN
 * de Yupoo directamente.
 */
export const IMAGE_PROXY_PATH = '/api/yupoo-img' as const

/**
 * Construye la URL del proxy para una imagen dada su hash y tamaño.
 * Ej: buildProxyUrl('abc123', 'big') → '/api/yupoo-img/abc123/big'
 */
export function buildProxyUrl(hash: string, size: YupooImageSize = 'big'): string {
  return `${IMAGE_PROXY_PATH}/${hash}/${size}`
}

// ============================================================================
// REGEX DE EXTRACCIÓN
// ============================================================================

/**
 * Regex para extraer un hash de imagen de una URL de Yupoo.
 * Los hashes son hexadecimales de 8 a 16 caracteres.
 * Ej: photo.yupoo.com/paypalshop/ab12cd34/big.jpg → "ab12cd34"
 */
export const HASH_REGEX = /paypalshop\/([a-f0-9]{8,16})/gi

/**
 * Regex para extraer el ID de un álbum desde una URL.
 * Ej: /albums/192510415 → "192510415"
 */
export const ALBUM_ID_REGEX = /\/albums\/(\d+)/

/**
 * Regex para extraer el ID de una categoría desde una URL.
 * Ej: /categories/3478225 → "3478225"
 */
export const CATEGORY_ID_REGEX = /\/categories\/(\d+)/

// ============================================================================
// VALIDACIONES
// ============================================================================

/**
 * Valida que un hash de imagen tenga el formato correcto.
 * @param hash - Hash a validar (ej: "ab12cd34")
 * @returns true si es válido
 */
export function isValidHash(hash: string): boolean {
  return /^[a-f0-9]{8,16}$/i.test(hash)
}

/**
 * Valida que un ID de álbum sea numérico y razonable.
 * @param albumId - ID a validar
 * @returns true si es válido
 */
export function isValidAlbumId(albumId: string): boolean {
  return /^\d{6,12}$/.test(albumId)
}

/**
 * Valida que un ID de categoría sea numérico.
 */
export function isValidCategoryId(categoryId: string): boolean {
  return /^\d{4,12}$/.test(categoryId)
}

// ============================================================================
// CACHÉ (Sistema de caché por álbum)
// ============================================================================

/**
 * Directorio donde se guarda la caché de álbumes procesados.
 * Cada álbum tiene su propio archivo: cache/{albumId}.json
 *
 * La caché contiene:
 * - Hash SHA-256 del contenido del álbum
 * - Fecha de procesamiento
 * - Datos del álbum parseado
 *
 * Si el hash no cambia, no se re-procesa el álbum.
 */
export const CACHE_DIR = 'cache' as const

// ============================================================================
// MODOS DE IMAGEN (proxy | local)
// ============================================================================

/**
 * Modo de manejo de imágenes:
 *
 * - 'proxy': Las URLs de imágenes apuntan al proxy interno
 *            /api/yupoo-img/{hash}/{size}
 *            El proxy resuelve desde Yupoo en tiempo real.
 *            Ventaja: no requiere descargar nada.
 *            Desventaja: depende de Yupoo online.
 *
 * - 'local': Las URLs de imágenes apuntan a archivos descargados
 *            en /public/yupoo-images/{hash}.jpg
 *            Ventaja: independiente de Yupoo, más rápido.
 *            Desventaja: requiere paso adicional de descarga.
 *
 * Por defecto usamos 'proxy' (el proxy ya está implementado).
 */
export type ImageMode = 'proxy' | 'local'

export const DEFAULT_IMAGE_MODE: ImageMode = 'proxy'

/**
 * Directorio donde se descargan las imágenes en modo 'local'.
 * (FASE futura — por ahora solo proxy)
 */
export const LOCAL_IMAGES_DIR = 'public/yupoo-images' as const

// ============================================================================
// ARQUITECTURA HÍBRIDA (HTTP+Cheerio | Playwright)
// ============================================================================

/**
 * Estrategia de fetching:
 *
 * - 'http-first': Intentar HTTP + Cheerio primero.
 *                 Si no encuentra el contenido esperado, usar Playwright.
 *                 Ventaja: rápido, ligero, paralelizable.
 *
 * - 'playwright-only': Usar siempre Playwright (renderiza JS).
 *                      Ventaja: captura todo el contenido dinámico.
 *                      Desventaja: lento, pesado en memoria.
 *
 * - 'http-only': Solo HTTP + Cheerio, sin fallback.
 *                Ventaja: máximo rendimiento.
 *                Desventaja: puede perder contenido JS-rendered.
 *
 * Por defecto: 'http-first' (híbrido, lo mejor de ambos mundos)
 */
export type FetchStrategy = 'http-first' | 'playwright-only' | 'http-only'

export const DEFAULT_FETCH_STRATEGY: FetchStrategy = 'http-first'

/**
 * Timeout para requests HTTP (ms).
 * Si excede, se intenta con Playwright (en modo http-first).
 */
export const HTTP_TIMEOUT_MS = 15_000 as const

/**
 * Timeout para fetch con Playwright (ms).
 */
export const PLAYWRIGHT_TIMEOUT_MS = 30_000 as const

/**
 * Número de retries HTTP antes de pasar a Playwright.
 */
export const HTTP_MAX_RETRIES = 2 as const

// ============================================================================
// HASHING (Detección de cambios)
// ============================================================================

/**
 * Algoritmo de hash para detectar cambios en álbumes.
 * SHA-256 — estándar, sin colisiones conocidas.
 */
export const HASH_ALGORITHM = 'sha256' as const
