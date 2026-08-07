/**
 * NEXORA — Verificación exacta de hrefs de álbumes
 *
 * Extrae hrefs EXACTOS del DOM de la página de categoría,
 * sin construir URLs manualmente.
 */

import { chromium } from 'playwright'
import { writeFileSync, mkdirSync, existsSync } from 'fs'

async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  VERIFICACIÓN EXACTA DE HREFS DE ÁLBUMES')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')

  // Crear directorio para guardar HTMLs
  const OUT_DIR = '/tmp/yupoo-verify'
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'es-ES',
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()

  // ============================================================================
  // PASO 1: Ir a la página de categoría Gucci
  // ============================================================================
  console.log('📂 Navegando a categoría Gucci (3478225)...')
  await page.goto('https://paypalshop.x.yupoo.com/categories/3478225', {
    waitUntil: 'networkidle',
    timeout: 30000,
  })
  await page.waitForTimeout(3000)

  // Scrollear para cargar lazy-load
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(2000)

  // ============================================================================
  // PASO 2: Extraer hrefs EXACTOS y bloques HTML completos
  // ============================================================================
  console.log('')
  console.log('🔍 Extrayendo hrefs EXACTOS del DOM...')

  const albumData = await page.evaluate(() => {
    const results: Array<{
      href: string
      outerHTML: string
      cardHTML: string
      albumId: string | null
    }> = []

    // Buscar todos los <a> con href que contenga /albums/
    const links = document.querySelectorAll('a[href*="/albums/"]')
    const seenHrefs = new Set<string>()

    links.forEach((link) => {
      const href = link.getAttribute('href') || ''

      // Solo hrefs que apunten a álbumes
      const match = href.match(/\/albums\/(\d+)/)
      if (!match) return

      const albumId = match[1]
      if (seenHrefs.has(href)) return
      seenHrefs.add(href)

      // Guardar el HTML del enlace mismo
      const outerHTML = link.outerHTML

      // Buscar el contenedor padre (card/album item)
      let cardEl: HTMLElement | null = link as HTMLElement
      // Subir varios niveles para encontrar el card completo
      for (let i = 0; i < 5; i++) {
        if (cardEl?.parentElement) {
          cardEl = cardEl.parentElement
          // Si el padre tiene clase que parece un card, parar
          const cls = cardEl.className || ''
          if (cls.includes('album') || cls.includes('card') || cls.includes('item') || cls.includes('show')) {
            break
          }
        }
      }
      const cardHTML = cardEl?.outerHTML?.substring(0, 2000) || ''

      results.push({
        href,
        outerHTML: outerHTML.substring(0, 500),
        cardHTML,
        albumId,
      })
    })

    return results.slice(0, 10) // primeros 10
  })

  console.log(`   ✓ ${albumData.length} álbumes extraídos del DOM`)
  console.log('')

  // Guardar los hrefs y HTMLs extraídos
  writeFileSync(`${OUT_DIR}/extracted-albums.json`, JSON.stringify(albumData, null, 2))
  console.log(`💾 Datos extraídos guardados en ${OUT_DIR}/extracted-albums.json`)
  console.log('')

  // Mostrar los hrefs extraídos
  console.log('=== HREFS EXACTOS EXTRAÍDOS DEL DOM ===')
  for (let i = 0; i < albumData.length; i++) {
    console.log(`  ${i + 1}. href: ${albumData[i].href}`)
    console.log(`     albumId: ${albumData[i].albumId}`)
  }
  console.log('')

  // ============================================================================
  // PASO 3: Para cada álbum, abrir la URL EXACTA del href
  // ============================================================================
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  VERIFICANDO CADA ÁLBUM CON URL EXACTA DEL HREF')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')

  const results: Array<{
    albumId: string
    originalHref: string
    finalUrl: string
    httpStatus: number
    title: string
    h1: string
    htmlPreview: string
    exists: boolean
    imageCount: number
  }> = []

  for (let i = 0; i < albumData.length; i++) {
    const album = albumData[i]
    console.log(`--- Álbum ${i + 1}/${albumData.length}: ${album.albumId} ---`)

    // Construir URL completa si el href es relativo
    let urlToVisit = album.href
    if (urlToVisit.startsWith('/')) {
      urlToVisit = `https://paypalshop.x.yupoo.com${urlToVisit}`
    }

    console.log(`  href original: ${album.href}`)
    console.log(`  URL a visitar:  ${urlToVisit}`)

    try {
      // Navegar a la URL exacta
      const response = await page.goto(urlToVisit, {
        waitUntil: 'networkidle',
        timeout: 30000,
      })
      await page.waitForTimeout(3000)

      const httpStatus = response?.status() || 0
      const finalUrl = page.url()
      const title = await page.title()
      const h1 = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() || '(sin h1)')

      // Contar imágenes del álbum
      const imageCount = await page.evaluate(() => {
        return document.querySelectorAll('img[src*="photo.yupoo.com/paypalshop/"]').length
      })

      // Guardar HTML completo de la página
      const fullHtml = await page.content()
      const htmlPreview = fullHtml.substring(0, 300)
      writeFileSync(`${OUT_DIR}/album-${album.albumId}.html`, fullHtml)

      const exists = !title.includes('页面未找到') && !h1.includes('no existe') && imageCount > 0

      console.log(`  HTTP status:   ${httpStatus}`)
      console.log(`  URL final:     ${finalUrl}`)
      console.log(`  Title:         ${title.substring(0, 80)}`)
      console.log(`  H1:            ${h1.substring(0, 80)}`)
      console.log(`  Imágenes:      ${imageCount}`)
      console.log(`  ¿Existe?       ${exists ? '✓ SÍ' : '✗ NO'}`)
      console.log(`  HTML guardado: ${OUT_DIR}/album-${album.albumId}.html`)
      console.log('')

      results.push({
        albumId: album.albumId!,
        originalHref: album.href,
        finalUrl,
        httpStatus,
        title,
        h1,
        htmlPreview,
        exists,
        imageCount,
      })
    } catch (e) {
      console.log(`  ❌ Error: ${(e as Error).message}`)
      console.log('')
      results.push({
        albumId: album.albumId!,
        originalHref: album.href,
        finalUrl: urlToVisit,
        httpStatus: 0,
        title: '(error)',
        h1: '(error)',
        htmlPreview: '',
        exists: false,
        imageCount: 0,
      })
    }
  }

  await browser.close()

  // ============================================================================
  // PASO 4: Guardar y mostrar informe final
  // ============================================================================
  writeFileSync(`${OUT_DIR}/verification-report.json`, JSON.stringify(results, null, 2))

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  INFORME FINAL')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  console.log('Álbum ID      | href exacto                              | HTTP | ¿Existe?')
  console.log('──────────────|──────────────────────────────────────────|──────|─────────')
  for (const r of results) {
    console.log(
      `${r.albumId.padEnd(13)}| ${r.originalHref.substring(0, 40).padEnd(41)}| ${String(r.httpStatus).padEnd(5)}| ${r.exists ? '✓' : '✗'}`
    )
  }
  console.log('')
  console.log(`💾 Informe completo: ${OUT_DIR}/verification-report.json`)
  console.log(`💾 HTMLs de álbumes: ${OUT_DIR}/album-*.html`)
  console.log(`💾 Datos extraídos: ${OUT_DIR}/extracted-albums.json`)
}

main().catch((e) => {
  console.error('❌ Fatal:', e)
  process.exit(1)
})
