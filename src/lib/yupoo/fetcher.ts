/**
 * NEXORA — Yupoo Importer · Fetcher (Híbrido HTTP + Playwright)
 * ================================================================
 *
 * Módulo: src/lib/yupoo/fetcher.ts
 *
 * RESPONSABILIDAD
 * ---------------
 * Obtener HTML de Yupoo con arquitectura híbrida:
 *   1. PRIMERO intentar HTTP + Cheerio (rápido, ligero)
 *   2. Si no encuentra contenido esperado, usar Playwright (renderiza JS)
 *
 * ESTRATEGIA
 * ----------
 * - 'http-first' (default): HTTP primero, Playwright como fallback
 * - 'playwright-only': Siempre Playwright
 * - 'http-only': Solo HTTP, sin fallback
 *
 * DETECCIÓN DE CONTENIDO JS-RENDERED
 * ----------------------------------
 * Yupoo es un SPA. Algunas páginas cargan contenido dinámicamente.
 * Si Cheerio no encuentra elementos clave (ej: .show-index__albumName),
 * asumimos que necesita Playwright.
 */

import * as cheerio from 'cheerio'
import type { Browser } from 'playwright'
import {
  YUPOO_DEFAULT_HEADERS,
  HTTP_TIMEOUT_MS,
  PLAYWRIGHT_TIMEOUT_MS,
  HTTP_MAX_RETRIES,
  PLAYWRIGHT_CONFIG,
  POST_LOAD_DELAY_MS,
  type FetchStrategy,
} from './config'
import { logger } from './utils'

// ============================================================================
// TIPOS
// ============================================================================

export interface FetchResult {
  /** HTML obtenido */
  html: string
  /** Método usado: 'http' o 'playwright' */
  method: 'http' | 'playwright'
  /** Si el fetch fue exitoso */
  success: boolean
  /** Código de estado HTTP (si aplica) */
  statusCode?: number
  /** Error si falló */
  error?: string
}

// ============================================================================
// HTTP + CHEERIO
// ============================================================================

/**
 * Obtiene HTML de una URL usando HTTP fetch.
 *
 * @param url - URL a obtener
 * @returns FetchResult con el HTML
 */
export async function fetchHtml(url: string): Promise<FetchResult> {
  for (let attempt = 0; attempt <= HTTP_MAX_RETRIES; attempt++) {
    try {
      const ctrl = new AbortController()
      const timeout = setTimeout(() => ctrl.abort(), HTTP_TIMEOUT_MS)

      const resp = await fetch(url, {
        headers: YUPOO_DEFAULT_HEADERS,
        signal: ctrl.signal,
        redirect: 'follow',
      })
      clearTimeout(timeout)

      if (!resp.ok) {
        if (resp.status === 404) {
          return { html: '', method: 'http', success: false, statusCode: 404, error: 'Not Found' }
        }
        throw new Error(`HTTP ${resp.status}`)
      }

      const html = await resp.text()
      return { html, method: 'http', success: true, statusCode: resp.status }
    } catch (e) {
      const isLast = attempt === HTTP_MAX_RETRIES
      logger.debug(`HTTP attempt ${attempt + 1}/${HTTP_MAX_RETRIES + 1} failed: ${(e as Error).message}`)
      if (isLast) {
        return {
          html: '',
          method: 'http',
          success: false,
          error: (e as Error).message,
        }
      }
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
    }
  }
  return { html: '', method: 'http', success: false, error: 'Max retries exceeded' }
}

// ============================================================================
// PLAYWRIGHT
// ============================================================================

/** Browser instance compartido (singleton) */
let _browser: Browser | null = null

/**
 * Obtiene o crea una instancia de browser Playwright.
 * Reutiliza la misma instancia para no lanzar múltiples browsers.
 */
async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.isConnected()) return _browser
  const { chromium } = await import('playwright')
  _browser = await chromium.launch(PLAYWRIGHT_CONFIG)
  return _browser
}

/**
 * Cierra el browser si está abierto.
 */
export async function closeBrowser(): Promise<void> {
  if (_browser) {
    await _browser.close()
    _browser = null
  }
}

/**
 * Obtiene HTML de una URL usando Playwright.
 * Renderiza JavaScript completamente.
 *
 * @param url - URL a obtener
 * @returns FetchResult con el HTML renderizado
 */
export async function fetchHtmlWithPlaywright(url: string): Promise<FetchResult> {
  try {
    const browser = await getBrowser()
    const context = await browser.newContext({
      userAgent: YUPOO_DEFAULT_HEADERS['User-Agent'],
      locale: PLAYWRIGHT_CONFIG.locale,
      viewport: PLAYWRIGHT_CONFIG.viewport,
    })
    const page = await context.newPage()

    await page.goto(url, { waitUntil: 'networkidle', timeout: PLAYWRIGHT_TIMEOUT_MS })
    await page.waitForTimeout(POST_LOAD_DELAY_MS)

    const html = await page.content()
    await context.close()

    return { html, method: 'playwright', success: true }
  } catch (e) {
    return {
      html: '',
      method: 'playwright',
      success: false,
      error: (e as Error).message,
    }
  }
}

// ============================================================================
// FETCHER HÍBRIDO PRINCIPAL
// ============================================================================

/**
 * Obtiene HTML usando la estrategia configurada.
 *
 * Estrategias:
 * - 'http-first': HTTP primero, Playwright si HTTP falla o no tiene contenido
 * - 'playwright-only': Siempre Playwright
 * - 'http-only': Solo HTTP, sin fallback
 *
 * @param url - URL a obtener
 * @param strategy - Estrategia de fetching
 * @param contentCheck - Función opcional que verifica si el HTML tiene contenido esperado
 * @returns FetchResult
 */
export async function fetchPage(
  url: string,
  strategy: FetchStrategy = 'http-first',
  contentCheck?: (html: string) => boolean
): Promise<FetchResult> {
  // Playwright-only: ir directo al browser
  if (strategy === 'playwright-only') {
    return fetchHtmlWithPlaywright(url)
  }

  // HTTP-first o HTTP-only: intentar HTTP primero
  const httpResult = await fetchHtml(url)

  if (httpResult.success && httpResult.html) {
    // Si hay contentCheck, verificar que el HTML tenga el contenido esperado
    if (contentCheck) {
      const hasContent = contentCheck(httpResult.html)
      if (hasContent) {
        return httpResult
      }
      // HTTP tuvo HTML pero no el contenido esperado (JS-rendered)
      if (strategy === 'http-first') {
        logger.debug(`HTTP sin contenido esperado, fallback a Playwright: ${url}`)
        return fetchHtmlWithPlaywright(url)
      }
      // http-only: retornar lo que tenemos aunque no tenga contenido
      return httpResult
    }
    // Sin contentCheck: confiar en HTTP
    return httpResult
  }

  // HTTP falló
  if (strategy === 'http-first' && httpResult.statusCode !== 404) {
    logger.debug(`HTTP falló (${httpResult.error}), fallback a Playwright: ${url}`)
    return fetchHtmlWithPlaywright(url)
  }

  return httpResult
}

// ============================================================================
// PARSER DE CHEERIO
// ============================================================================

/**
 * Carga HTML en Cheerio para parsing.
 *
 * @param html - HTML a parsear
 * @returns Instancia de Cheerio API
 */
export function loadHtml(html: string): ReturnType<typeof cheerio.load> {
  return cheerio.load(html)
}

// ============================================================================
// DETECCIÓN DE CONTENIDO
// ============================================================================

/**
 * Verifica si un HTML tiene contenido de álbum de Yupoo.
 * Se usa como contentCheck para decidir si necesita Playwright.
 *
 * @param html - HTML a verificar
 * @returns true si parece tener contenido de álbum
 */
export function hasAlbumContent(html: string): boolean {
  if (!html || html.length < 500) return false
  const $ = loadHtml(html)
  // Yupoo tiene estos elementos cuando el álbum cargó
  return (
    $('img[src*="photo.yupoo.com/paypalshop/"]').length > 0 ||
    $('[data-src*="photo.yupoo.com/paypalshop/"]').length > 0
  )
}

/**
 * Verifica si un HTML tiene contenido de categorías de Yupoo.
 *
 * @param html - HTML a verificar
 * @returns true si tiene links a categorías
 */
export function hasCategoryContent(html: string): boolean {
  if (!html || html.length < 500) return false
  const $ = loadHtml(html)
  return $('a[href*="/categories/"]').length > 0
}

/**
 * Verifica si un HTML indica que el álbum no existe (404).
 *
 * @param html - HTML a verificar
 * @returns true si el álbum no existe
 */
export function isAlbumNotFound(html: string): boolean {
  if (!html) return true
  return (
    html.includes('页面未找到') ||
    html.includes('该相册已不存在') ||
    html.includes('Not Found')
  )
}
