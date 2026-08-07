/**
 * NEXORA — Scraper con Playwright
 *
 * Extrae de cada álbum de Yupoo:
 * - Título real del producto (renderizado, no del HTML crudo)
 * - Lista de hashes de imágenes (en orden del DOM)
 * - Videos si los hay
 * - Precio si está visible
 *
 * Output: /tmp/scraped-albums.json
 */
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, existsSync } from 'fs'

interface ProductToScrape {
  id: string
  sku: string
  name: string
  referenceUrl: string
  brandId: string
  brand: { name: string }
  category: { name: string }
}

interface ScrapedAlbum {
  productId: string
  albumId: string
  realName: string | null
  description: string | null
  price: string | null
  hashes: string[]
  videoUrls: string[]
  scrapedAt: string
}

async function scrapeAlbum(page: any, albumUrl: string): Promise<Partial<ScrapedAlbum>> {
  try {
    await page.goto(albumUrl, { waitUntil: 'networkidle', timeout: 30000 })
    // Esperar a que carguen las imágenes
    await page.waitForTimeout(2000)

    // Extraer título real del producto
    const realName = await page.evaluate(() => {
      // Yupoo usa .show-index__albumName o h1 para el título
      const selectors = [
        '.show-index__albumName',
        '.show-index__album-title',
        'h1.show-index__albumName',
        '.album__title',
        'h1',
        'title',
      ]
      for (const sel of selectors) {
        const el = document.querySelector(sel)
        if (el && el.textContent) {
          const text = el.textContent.trim()
          if (text.length > 3 && !text.includes('又拍图片管家')) {
            return text.replace(/\s*\|\s*相册.*$/, '').replace(/\byupoo\b/gi, '').trim()
          }
        }
      }
      // Fallback: title del document
      const title = document.title
      const parts = title.split(' | ')
      if (parts.length > 0) {
        return parts[0].replace(/\byupoo\b/gi, '').trim()
      }
      return null
    })

    // Extraer descripción si existe
    const description = await page.evaluate(() => {
      const el = document.querySelector('.show-index__albumDescription, .album__description, .description')
      return el?.textContent?.trim() || null
    })

    // Extraer precio si está visible
    const price = await page.evaluate(() => {
      const el = document.querySelector('.show-index__albumPrice, .album__price, .price')
      return el?.textContent?.trim() || null
    })

    // Extraer hashes de imágenes en orden del DOM
    const hashes = await page.evaluate(() => {
      const hashSet = new Set<string>()
      // Buscar todos los elementos img que apuntan a photo.yupoo.com/paypalshop/
      const imgs = document.querySelectorAll('img[src*="photo.yupoo.com/paypalshop/"]')
      imgs.forEach((img) => {
        const src = img.getAttribute('src') || img.getAttribute('data-src') || ''
        const match = src.match(/paypalshop\/([a-f0-9]{8,16})/)
        if (match) hashSet.add(match[1])
      })
      // También buscar en data-src
      const dataSrcs = document.querySelectorAll('[data-src*="photo.yupoo.com/paypalshop/"]')
      dataSrcs.forEach((el) => {
        const src = el.getAttribute('data-src') || ''
        const match = src.match(/paypalshop\/([a-f0-9]{8,16})/)
        if (match) hashSet.add(match[1])
      })
      return [...hashSet]
    })

    // Extraer videos
    const videoUrls = await page.evaluate(() => {
      const videos: string[] = []
      // Buscar elementos video
      document.querySelectorAll('video source').forEach((source) => {
        const src = source.getAttribute('src') || ''
        if (src.includes('paypalshop')) videos.push(src)
      })
      // Buscar en data-video
      document.querySelectorAll('[data-video-url]').forEach((el) => {
        const url = el.getAttribute('data-video-url') || ''
        if (url) videos.push(url)
      })
      return videos
    })

    return { realName, description, price, hashes, videoUrls }
  } catch (e) {
    console.error(`   ❌ Error scraping ${albumUrl}:`, (e as Error).message.substring(0, 100))
    return { realName: null, description: null, price: null, hashes: [], videoUrls: [] }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  NEXORA — Scraper con Playwright (100 productos featured)')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')

  // Cargar productos a scrapear
  const products: ProductToScrape[] = JSON.parse(
    readFileSync('/tmp/products-to-scrape.json', 'utf8')
  )
  console.log(`📋 ${products.length} productos para scrapear`)
  console.log('')

  // Cargar progreso previo si existe
  const OUTPUT_FILE = '/tmp/scraped-albums.json'
  const results: ScrapedAlbum[] = existsSync(OUTPUT_FILE)
    ? JSON.parse(readFileSync(OUTPUT_FILE, 'utf8'))
    : []
  const scrapedIds = new Set(results.map((r) => r.productId))
  console.log(`↩️  Ya scrapeados: ${scrapedIds.size}`)
  console.log('')

  // Lanzar browser
  console.log('🚀 Iniciando Chromium...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'es-ES',
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()

  const startTime = Date.now()
  let count = 0

  for (const product of products) {
    if (scrapedIds.has(product.id)) {
      count++
      continue
    }

    const albumId = product.referenceUrl.match(/albums\/(\d+)/)?.[1] || ''
    if (!albumId) continue

    process.stdout.write(`\r  [${count + 1}/${products.length}] Scrapeando álbum ${albumId}...           `)

    const scraped = await scrapeAlbum(page, product.referenceUrl)

    results.push({
      productId: product.id,
      albumId,
      realName: scraped.realName || null,
      description: scraped.description || null,
      price: scraped.price || null,
      hashes: scraped.hashes || [],
      videoUrls: scraped.videoUrls || [],
      scrapedAt: new Date().toISOString(),
    })

    count++

    // Guardar progreso cada 5 productos
    if (count % 5 === 0) {
      writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2))
    }
  }

  // Guardar resultado final
  writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2))

  await browser.close()

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
  console.log('')
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`✅ Scraping completado en ${elapsed}s`)
  console.log(`   Productos scrapeados: ${results.length}`)
  console.log(`   Con nombre real: ${results.filter((r) => r.realName).length}`)
  console.log(`   Con múltiples fotos: ${results.filter((r) => r.hashes.length > 1).length}`)
  console.log(`   Con videos: ${results.filter((r) => r.videoUrls.length > 0).length}`)
  console.log(`   💾 Guardado en ${OUTPUT_FILE}`)
  console.log('═══════════════════════════════════════════════════════════════')

  // Mostrar muestra
  console.log('')
  console.log('=== MUESTRA DE RESULTADOS ===')
  for (const r of results.slice(0, 5)) {
    console.log(`  📦 ${r.albumId}: ${r.realName || '(sin nombre)'}`)
    console.log(`     ${r.hashes.length} fotos | ${r.videoUrls.length} videos`)
  }
}

main()
  .catch((e) => { console.error('❌ Fatal:', e); process.exit(1) })
