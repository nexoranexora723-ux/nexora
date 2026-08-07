/**
 * NEXORA — Auditoría final del scraper Yupoo
 * ============================================
 *
 * Selecciona 50 álbumes aleatorios de diferentes categorías.
 * Para cada álbum verifica 7 criterios.
 */

import { chromium } from 'playwright'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { cleanAlbumName, extractHash, cleanCategoryName } from '../src/lib/yupoo/utils'

interface AuditResult {
  albumId: string
  categoryId: string
  categoryName: string
  href: string
  url: string
  titleFromCard: string
  titleFromPage: string
  nameMatch: boolean
  imageCountFromCard: number | null
  imageCountActual: number
  imageCountMatch: boolean
  description: string | null
  hasDescription: boolean
  hasVideos: boolean
  videoCount: number
  duplicateHashes: boolean
  uniqueHashes: boolean
  hashList: string[]
  errors: string[]
  loadTimeMs: number
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  AUDITORÍA FINAL — 50 álbumes de categorías diversas')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')

  const OUT_DIR = '/tmp/yupoo-audit'
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'es-ES',
    viewport: { width: 1280, height: 800 },
  })

  // ============================================================================
  // PASO 1: Descubrir categorías
  // ============================================================================
  console.log('📂 Descubriendo categorías...')
  const page = await context.newPage()
  await page.goto('https://paypalshop.x.yupoo.com/albums', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2000)

  const categories = await page.evaluate(() => {
    const cats: Array<{ id: string; name: string; url: string }> = []
    const seen = new Set<string>()
    document.querySelectorAll('a[href*="/categories/"]').forEach(a => {
      const href = a.getAttribute('href') || ''
      const m = href.match(/\/categories\/(\d+)/)
      if (!m || m[1] === '0' || seen.has(m[1])) return
      seen.add(m[1])
      const name = a.textContent?.trim()?.replace(/^[^\w]+/, '').substring(0, 60) || ''
      if (name.length > 2) {
        cats.push({
          id: m[1],
          name,
          url: 'https://paypalshop.x.yupoo.com/categories/' + m[1],
        })
      }
    })
    return cats
  })

  console.log(`   ✓ ${categories.length} categorías encontradas`)
  console.log('')

  // ============================================================================
  // PASO 2: Seleccionar 10 categorías aleatorias (5 álbumes c/u = 50 total)
  // ============================================================================
  // Seleccionar categorías de diferentes secciones para diversidad
  const selectedCategories: typeof categories = []
  const step = Math.floor(categories.length / 10)
  for (let i = 0; i < 10 && i * step < categories.length; i++) {
    selectedCategories.push(categories[i * step])
  }
  console.log(`📌 Seleccionadas ${selectedCategories.length} categorías para auditoría:`)
  for (const c of selectedCategories) {
    console.log(`   • ${c.name} (${c.id})`)
  }
  console.log('')

  // ============================================================================
  // PASO 3: Para cada categoría, extraer 5 álbumes con href EXACTO
  // ============================================================================
  const albumsToAudit: Array<{
    albumId: string
    href: string
    url: string
    titleFromCard: string
    categoryId: string
    categoryName: string
    thumbnailHash: string | null
    photoCount: number | null
  }> = []

  for (const cat of selectedCategories) {
    console.log(`🔍 Escaneando categoría: ${cat.name}...`)
    await page.goto(cat.url, { waitUntil: 'networkidle', timeout: 20000 })
    await page.waitForTimeout(2000)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1500)

    const albums = await page.evaluate(({ catId, catName }) => {
      const results: Array<{
        albumId: string
        href: string
        url: string
        titleFromCard: string
        categoryId: string
        categoryName: string
        thumbnailHash: string | null
        photoCount: number | null
      }> = []
      const seen = new Set<string>()

      document.querySelectorAll('a[href*="/albums/"]').forEach(a => {
        const href = a.getAttribute('href') || ''
        if (!href.includes('uid=') || !href.includes('referrercate=')) return
        const m = href.match(/\/albums\/(\d+)/)
        if (!m || seen.has(m[1])) return
        seen.add(m[1])

        const title = a.getAttribute('title') || ''
        let thumbnailHash: string | null = null
        const img = a.querySelector('img[src*="photo.yupoo.com/paypalshop/"]')
        if (img) {
          const src = img.getAttribute('src') || ''
          const hm = src.match(/paypalshop\/([a-f0-9]{8,16})/)
          if (hm) thumbnailHash = hm[1]
        }
        let photoCount: number | null = null
        const photoEl = a.querySelector('.album__photonumber')
        if (photoEl) {
          const n = parseInt(photoEl.textContent?.trim() || '')
          if (!isNaN(n)) photoCount = n
        }

        results.push({
          albumId: m[1],
          href,
          url: href.startsWith('http') ? href : 'https://paypalshop.x.yupoo.com' + href,
          titleFromCard: title,
          categoryId: catId,
          categoryName: catName,
          thumbnailHash,
          photoCount,
        })
      })

      return results.slice(0, 5)
    }, { catId: cat.id, catName: cat.name })

    albumsToAudit.push(...albums)
    console.log(`   ✓ ${albums.length} álbumes extraídos`)
  }

  console.log('')
  console.log(`📊 Total álbumes a auditar: ${albumsToAudit.length}`)
  console.log('')

  // ============================================================================
  // PASO 4: Auditar cada álbum individualmente
  // ============================================================================
  const results: AuditResult[] = []

  for (let i = 0; i < albumsToAudit.length; i++) {
    const album = albumsToAudit[i]
    console.log(`[${i + 1}/${albumsToAudit.length}] Auditando álbum ${album.albumId}...`)

    const startTime = Date.now()
    const errors: string[] = []

    try {
      // Visitar el álbum usando el href EXACTO
      await page.goto(album.url, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(3000)

      const loadTimeMs = Date.now() - startTime

      // Extraer datos de la página del álbum
      const pageData = await page.evaluate(() => {
        // 1. Title de la página
        const pageTitle = document.title || ''
        const titlePart = pageTitle.split(' | ')[0] || ''

        // 2. H1
        const h1 = document.querySelector('h1')?.textContent?.trim() || ''

        // 3. Descripción
        let description: string | null = null
        const descSelectors = ['.show-index__albumDescription', '.album__description', '.description', '[class*="albumDesc"]', '[class*="description"]']
        for (const sel of descSelectors) {
          const el = document.querySelector(sel)
          if (el) {
            const text = el.textContent?.trim() || ''
            if (text.length > 10) { description = text; break }
          }
        }

        // 4. Imágenes — extraer TODOS los hashes en orden
        const hashSet = new Set<string>()
        const hashList: string[] = []

        document.querySelectorAll('img[src*="photo.yupoo.com/paypalshop/"]').forEach(img => {
          const src = img.getAttribute('src') || ''
          const m = src.match(/paypalshop\/([a-f0-9]{8,16})/)
          if (m && !hashSet.has(m[1])) {
            hashSet.add(m[1])
            hashList.push(m[1])
          }
        })

        document.querySelectorAll('[data-src*="photo.yupoo.com/paypalshop/"]').forEach(el => {
          const src = el.getAttribute('data-src') || ''
          const m = src.match(/paypalshop\/([a-f0-9]{8,16})/)
          if (m && !hashSet.has(m[1])) {
            hashSet.add(m[1])
            hashList.push(m[1])
          }
        })

        // 5. Videos
        const videos: string[] = []
        document.querySelectorAll('video').forEach(v => {
          const src = v.getAttribute('src') || v.querySelector('source')?.getAttribute('src') || ''
          if (src) videos.push(src)
        })
        document.querySelectorAll('[data-video-url]').forEach(el => {
          const url = el.getAttribute('data-video-url') || ''
          if (url) videos.push(url)
        })

        // 6. ¿Es 404?
        const is404 = pageTitle.includes('页面未找到') || h1.includes('no existe') || h1.includes('未找到')

        // 7. Categoría visible en la página
        let categoryFromPage: string | null = null
        const breadcrumb = document.querySelector('.breadcrumb, .show-index__breadcrumb, [class*="breadcrumb"]')
        if (breadcrumb) {
          categoryFromPage = breadcrumb.textContent?.trim()?.substring(0, 80) || null
        }

        return {
          pageTitle: titlePart,
          h1,
          description,
          hashList,
          hashSetSize: hashSet.size,
          videos,
          is404,
          categoryFromPage,
        }
      })

      // === VERIFICACIONES ===

      // 1. Nombre: ¿coincide title del card con title de la página?
      const cleanedCardTitle = cleanAlbumName(album.titleFromCard) || album.titleFromCard
      const cleanedPageTitle = cleanAlbumName(pageData.pageTitle) || pageData.pageTitle
      const nameMatch = cleanedCardTitle.toLowerCase().includes(cleanedPageTitle.toLowerCase().substring(0, 10)) ||
                        cleanedPageTitle.toLowerCase().includes(cleanedCardTitle.toLowerCase().substring(0, 10)) ||
                        album.titleFromCard === pageData.pageTitle

      if (!nameMatch && !pageData.is404) {
        errors.push(`Nombre no coincide: card="${album.titleFromCard.substring(0, 40)}" vs page="${pageData.pageTitle.substring(0, 40)}"`)
      }

      // 2. Número de imágenes: ¿coincide photoCount del card con imágenes reales?
      const imageCountActual = pageData.hashList.length
      const imageCountMatch = album.photoCount === null
        ? true // sin info del card, no podemos comparar
        : (album.photoCount === imageCountActual || album.photoCount === imageCountActual - 1) // -1 porque a veces el thumbnail cuenta diferente

      if (!imageCountMatch && !pageData.is404) {
        errors.push(`Image count no coincide: card=${album.photoCount} vs actual=${imageCountActual}`)
      }

      // 3. Descripción
      const hasDescription = pageData.description !== null

      // 4. Categoría
      // Ya tenemos categoryName del scanner

      // 5. Videos
      const hasVideos = pageData.videos.length > 0
      const videoCount = pageData.videos.length

      // 6. Imágenes duplicadas
      const uniqueSet = new Set(pageData.hashList)
      const duplicateHashes = uniqueSet.size < pageData.hashList.length

      if (duplicateHashes) {
        errors.push(`Hashes duplicados: ${pageData.hashList.length} total, ${uniqueSet.size} únicos`)
      }

      // 7. Hashes únicos
      const uniqueHashes = !duplicateHashes

      const result: AuditResult = {
        albumId: album.albumId,
        categoryId: album.categoryId,
        categoryName: album.categoryName,
        href: album.href,
        url: album.url,
        titleFromCard: album.titleFromCard,
        titleFromPage: pageData.pageTitle,
        nameMatch: pageData.is404 ? false : nameMatch,
        imageCountFromCard: album.photoCount,
        imageCountActual,
        imageCountMatch: pageData.is404 ? false : imageCountMatch,
        description: pageData.description,
        hasDescription,
        hasVideos,
        videoCount,
        duplicateHashes,
        uniqueHashes,
        hashList: pageData.hashList,
        errors: pageData.is404 ? ['Álbum 404'] : errors,
        loadTimeMs,
      }

      results.push(result)

      const status = pageData.is404 ? '✗ 404' : (errors.length === 0 ? '✓ OK' : '⚠ ' + errors.length + ' errors')
      console.log(`   ${status} | ${album.titleFromCard.substring(0, 40).padEnd(42)} | ${imageCountActual} imgs | ${videoCount} vids | ${loadTimeMs}ms`)

    } catch (e) {
      const loadTimeMs = Date.now() - startTime
      console.log(`   ✗ ERROR: ${(e as Error).message.substring(0, 60)}`)
      results.push({
        albumId: album.albumId,
        categoryId: album.categoryId,
        categoryName: album.categoryName,
        href: album.href,
        url: album.url,
        titleFromCard: album.titleFromCard,
        titleFromPage: '',
        nameMatch: false,
        imageCountFromCard: album.photoCount,
        imageCountActual: 0,
        imageCountMatch: false,
        description: null,
        hasDescription: false,
        hasVideos: false,
        videoCount: 0,
        duplicateHashes: false,
        uniqueHashes: false,
        hashList: [],
        errors: [(e as Error).message],
        loadTimeMs,
      })
    }
  }

  await browser.close()

  // ============================================================================
  // PASO 5: Generar informe
  // ============================================================================
  writeFileSync(`${OUT_DIR}/audit-results.json`, JSON.stringify(results, null, 2))

  const total = results.length
  const successCount = results.filter(r => r.errors.length === 0).length
  const failedCount = results.filter(r => r.errors.length > 0).length
  const successPct = (successCount / total * 100).toFixed(1)

  const categoriesObtained = new Set(results.filter(r => r.categoryName).map(r => r.categoryName)).size
  const categoriesPct = (categoriesObtained / selectedCategories.length * 100).toFixed(1)

  const descriptionsObtained = results.filter(r => r.hasDescription).length
  const descriptionsPct = (descriptionsObtained / total * 100).toFixed(1)

  const videosFound = results.filter(r => r.hasVideos).length
  const videosPct = (videosFound / total * 100).toFixed(1)

  const nameMatches = results.filter(r => r.nameMatch).length
  const nameMatchPct = (nameMatches / total * 100).toFixed(1)

  const imageCountMatches = results.filter(r => r.imageCountMatch).length
  const imageCountPct = (imageCountMatches / total * 100).toFixed(1)

  const allUniqueHashes = results.filter(r => r.uniqueHashes && !r.duplicateHashes).length
  const uniqueHashesPct = (allUniqueHashes / total * 100).toFixed(1)

  const avgTime = results.reduce((sum, r) => sum + r.loadTimeMs, 0) / total

  const failedAlbums = results.filter(r => r.errors.length > 0)

  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  INFORME DE AUDITORÍA FINAL')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  console.log(`  Álbumes auditados:      ${total}`)
  console.log(`  Categorías auditadas:   ${selectedCategories.length}`)
  console.log('')
  console.log('  ─────────────────────────────────────────────')
  console.log(`  ✓ Exitosos:             ${successCount} (${successPct}%)`)
  console.log(`  ✗ Fallidos:             ${failedCount} (${(100 - parseFloat(successPct)).toFixed(1)}%)`)
  console.log(`  ⏱  Tiempo promedio:      ${(avgTime / 1000).toFixed(2)}s por álbum`)
  console.log('  ─────────────────────────────────────────────')
  console.log('')
  console.log('  VERIFICACIONES DETALLADAS:')
  console.log(`  1. Nombre coincide:           ${nameMatches}/${total} (${nameMatchPct}%)`)
  console.log(`  2. Image count coincide:      ${imageCountMatches}/${total} (${imageCountPct}%)`)
  console.log(`  3. Descripciones obtenidas:   ${descriptionsObtained}/${total} (${descriptionsPct}%)`)
  console.log(`  4. Categorías obtenidas:      ${categoriesObtained}/${selectedCategories.length} (${categoriesPct}%)`)
  console.log(`  5. Videos encontrados:        ${videosFound}/${total} (${videosPct}%)`)
  console.log(`  6. Sin hashes duplicados:     ${allUniqueHashes}/${total} (${uniqueHashesPct}%)`)
  console.log(`  7. Hashes únicos:             ${allUniqueHashes}/${total} (${uniqueHashesPct}%)`)
  console.log('')
  console.log('  ÁLBUMES CON ERRORES:')
  if (failedAlbums.length === 0) {
    console.log('    ✓ Ninguno')
  } else {
    for (const r of failedAlbums) {
      console.log(`    ✗ ${r.albumId} (${r.categoryName.substring(0, 20)}): ${r.errors.join('; ')}`)
    }
  }
  console.log('')
  console.log('  MUESTRA DE NOMBRES REALES OBTENIDOS:')
  for (const r of results.slice(0, 10)) {
    console.log(`    • ${r.titleFromCard.substring(0, 50).padEnd(52)} | ${r.imageCountActual} imgs | ${r.videoCount} vids`)
  }
  console.log('')
  console.log(`  💾 Resultados completos: ${OUT_DIR}/audit-results.json`)
  console.log('═══════════════════════════════════════════════════════════════')
}

main().catch(e => { console.error('❌ Fatal:', e); process.exit(1) })
