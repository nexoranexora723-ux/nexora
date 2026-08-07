/**
 * NEXORA — Yupoo Importer · Parser (Extracción)
 * ================================================
 *
 * Módulo: src/lib/yupoo/parser.ts
 *
 * RESPONSABILIDAD
 * ---------------
 * Extraer el contenido completo de un álbum individual de Yupoo:
 *   - Nombre original (del title o h1 del HTML)
 *   - Descripción (si existe)
 *   - Categoría a la que pertenece
 *   - TODAS las imágenes (hashes en orden del DOM)
 *   - TODOS los videos (si los hay)
 *   - Precio (si está visible)
 *
 * REGLAS ESTRICTAS
 * ----------------
 * 1. Toda la información proviene del HTML del álbum
 * 2. NO se usa IA para reconocer productos
 * 3. NO se usa OCR
 * 4. NO se usa visión artificial
 * 5. NO se inventan nombres
 * 6. Cada álbum = exactamente UN producto
 * 7. Nunca se trabaja por imagen individual
 *
 * ARQUITECTURA
 * ------------
 * Usa Playwright para renderizar JavaScript (galerías cargan dinámicamente).
 * La extracción se hace con page.evaluate() sobre el DOM renderizado.
 *
 * FASE 1: Solo definición de interfaces y firmas.
 *         La implementación completa se hará en FASE 2.
 */

import type { YupooAlbumRef, YupooAlbum, AlbumParseResult } from './types'

// ============================================================================
// FACHADA PÚBLICA DEL PARSER
// ============================================================================

/**
 * Parsea un álbum individual de Yupoo y extrae TODO su contenido.
 *
 * PROCESO:
 * 1. Abre la URL del álbum con Playwright
 * 2. Espera a que carguen las imágenes (lazy-load)
 * 3. Extrae del DOM renderizado:
 *    - Nombre: del <title> o h1 (limpio con cleanAlbumName)
 *    - Descripción: de .show-index__albumDescription si existe
 *    - Imágenes: todos los <img> con src en photo.yupoo.com/paypalshop/
 *    - Videos: elementos <video> o [data-video-url]
 *    - Precio: si hay elemento .album__price
 * 4. Construye YupooAlbum con todos los datos
 *
 * @param albumRef - Referencia al álbum (de scanner.scanAlbumsFromCategory)
 * @returns Promise<AlbumParseResult> - Álbum parseado o error
 *
 * @example
 * ```ts
 * const result = await parseAlbum(albumRef)
 * if (result.success && result.album) {
 *   console.log(`Álbum: ${result.album.name}`)
 *   console.log(`Imágenes: ${result.album.images.length}`)
 * }
 * ```
 */
export async function parseAlbum(albumRef: YupooAlbumRef): Promise<AlbumParseResult> {
  // 🚧 IMPLEMENTACIÓN EN FASE 2
  //
  // const startTime = Date.now()
  // try {
  //   // 1. Abrir página con Playwright
  //   // 2. Esperar networkidle + POST_LOAD_DELAY_MS
  //   // 3. page.evaluate() para extraer todos los datos
  //   // 4. Construir YupooAlbum con:
  //   //    - name: cleanAlbumName(title)
  //   //    - description: de .show-index__albumDescription
  //   //    - images: array de YupooImage con hash, proxyUrl, order
  //   //    - videos: array de YupooVideo
  //   //    - exists: true (si llegó aquí sin 404)
  //   // 5. Retornar { album, success: true, durationMs }
  // } catch (error) {
  //   // Retornar { album: null, success: false, error, durationMs }
  // }
  throw new Error('parseAlbum() se implementará en FASE 2 — pendiente aprobación')
}

/**
 * Parsea múltiples álbumes en paralelo (con límite de concurrencia).
 *
 * Usa CONCURRENT_ALBUMS del config para no saturar Yupoo.
 *
 * @param albumRefs - Lista de referencias a álbumes
 * @param onProgress - Callback opcional para reportar progreso
 * @returns Promise<AlbumParseResult[]> - Resultados en el mismo orden
 *
 * @example
 * ```ts
 * const results = await parseAlbumsBatch(albumRefs, (i, total, result) => {
 *   console.log(`[${i}/${total}] ${result.album?.name}`)
 * })
 * const successful = results.filter(r => r.success)
 * ```
 */
export async function parseAlbumsBatch(
  albumRefs: YupooAlbumRef[],
  onProgress?: (index: number, total: number, result: AlbumParseResult) => void
): Promise<AlbumParseResult[]> {
  // 🚧 IMPLEMENTACIÓN EN FASE 2
  // - Procesar en lotes de CONCURRENT_ALBUMS
  // - Promise.all() por lote
  // - Llamar onProgress después de cada álbum
  // - Reutilizar el mismo browser instance
  throw new Error('parseAlbumsBatch() se implementará en FASE 2 — pendiente aprobación')
}

// ============================================================================
// FUNCIONES DE EXTRACCIÓN ESPECÍFICAS (internas)
// ============================================================================

/**
 * [PRIVADO] Extrae el nombre del álbum desde el DOM renderizado.
 *
 * Busca en este orden:
 * 1. .show-index__albumName (selector específico de Yupoo)
 * 2. h1 (fallback genérico)
 * 3. document.title (último recurso)
 *
 * Limpia el texto con cleanAlbumName() para quitar "yupoo" y sufijos.
 *
 * Será implementado en FASE 2.
 */
async function _extractAlbumName(_page: import('playwright').Page): Promise<string | null> {
  // 🚧 FASE 2
  // return await page.evaluate(() => {
  //   const selectors = ['.show-index__albumName', 'h1']
  //   for (const sel of selectors) {
  //     const el = document.querySelector(sel)
  //     if (el?.textContent) {
  //       const text = el.textContent.trim()
  //       if (text.length > 3 && !text.includes('又拍图片管家')) {
  //         return text
  //       }
  //     }
  //   }
  //   // Fallback: document.title
  //   return document.title.split(' | ')[0]
  // })
  throw new Error('Pendiente FASE 2')
}

/**
 * [PRIVADO] Extrae todas las imágenes del álbum desde el DOM.
 *
 * Busca todos los <img> con src que contenga "photo.yupoo.com/paypalshop/"
 * Extrae el hash de cada URL (regex HASH_REGEX)
 * Deduplica manteniendo el orden
 * Construye YupooImage con proxyUrl para cada una
 *
 * Será implementado en FASE 2.
 */
async function _extractImages(_page: import('playwright').Page): Promise<import('./types').YupooImage[]> {
  // 🚧 FASE 2
  // return await page.evaluate(() => {
  //   const hashSet = new Set<string>()
  //   const ordered: string[] = []
  //
  //   document.querySelectorAll('img[src*="photo.yupoo.com/paypalshop/"]').forEach(img => {
  //     const src = img.getAttribute('src') || ''
  //     const match = src.match(/paypalshop\/([a-f0-9]{8,16})/)
  //     if (match && !hashSet.has(match[1])) {
  //       hashSet.add(match[1])
  //       ordered.push(match[1])
  //     }
  //   })
  //
  //   // También data-src (lazy load)
  //   document.querySelectorAll('[data-src*="photo.yupoo.com/paypalshop/"]').forEach(el => {
  //     const src = el.getAttribute('data-src') || ''
  //     const match = src.match(/paypalshop\/([a-f0-9]{8,16})/)
  //     if (match && !hashSet.has(match[1])) {
  //       hashSet.add(match[1])
  //       ordered.push(match[1])
  //     }
  //   })
  //
  //   return ordered
  // })
  throw new Error('Pendiente FASE 2')
}

/**
 * [PRIVADO] Extrae videos del álbum si los hay.
 *
 * Busca elementos <video> y [data-video-url].
 * Los videos de Yupoo están en el mismo CDN que las imágenes.
 *
 * Será implementado en FASE 2.
 */
async function _extractVideos(_page: import('playwright').Page): Promise<import('./types').YupooVideo[]> {
  // 🚧 FASE 2
  throw new Error('Pendiente FASE 2')
}

/**
 * [PRIVADO] Extrae la descripción del álbum si existe.
 *
 * Busca .show-index__albumDescription o .album__description.
 *
 * Será implementado en FASE 2.
 */
async function _extractDescription(_page: import('playwright').Page): Promise<string | null> {
  // 🚧 FASE 2
  throw new Error('Pendiente FASE 2')
}

/**
 * [PRIVADO] Verifica si el álbum existe (no es 404).
 *
 * Yupoo muestra "页面未找到" (página no encontrada) cuando un álbum
 * fue eliminado. Esta función detecta ese caso.
 *
 * Será implementado en FASE 2.
 */
async function _checkAlbumExists(_page: import('playwright').Page): Promise<boolean> {
  // 🚧 FASE 2
  // return await page.evaluate(() => {
  //   return !document.title.includes('页面未找到') &&
  //          !document.body.innerText.includes('该相册已不存在')
  // })
  throw new Error('Pendiente FASE 2')
}
