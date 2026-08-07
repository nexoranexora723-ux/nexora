#!/usr/bin/env bun
/**
 * NEXORA — Script importador principal de Yupoo
 * ===============================================
 *
 * Uso:
 *   bun run scripts/yupoo-import-main.ts
 *   bun run scripts/yupoo-import-main.ts --max-categories=5
 *   bun run scripts/yupoo-import-main.ts --strategy=playwright-only
 *
 * Flujo:
 *   1. Escanear categorías (scanCategories)
 *   2. Por cada categoría, descubrir álbumes (scanAlbumsFromCategory)
 *   3. Por cada álbum:
 *      a. Verificar caché (¿ya procesado sin cambios?)
 *      b. Parsear álbum (parseAlbum)
 *      c. Validar (FASE 2.5)
 *      d. Si válido: guardar en data/products/{num}.json + actualizar index
 *      e. Si inválido: guardar en data/failed.json
 *      f. Guardar en caché
 */

import {
  scanCategories,
  scanAlbumsFromCategory,
  parseAlbum,
  validateAlbum,
  recordFailedAlbum,
  recordParseFailure,
  toScrapedProduct,
  computeAlbumHash,
  isAlbumCached,
  setAlbumCache,
  ensureDirs,
  saveProduct,
  upsertIndexEntry,
  productFileName,
  getNextProductNumber,
  loadIndex,
  countProducts,
  countFailed,
  closeBrowser,
  logger,
  DEFAULT_FETCH_STRATEGY,
  DEFAULT_IMAGE_MODE,
  type FetchStrategy,
  type ImageMode,
  type YupooAlbumRef,
} from '../src/lib/yupoo'

// ============================================================================
// PARSEAR ARGUMENTOS
// ============================================================================

function parseArgs(): {
  maxCategories: number | null
  maxAlbumsPerCategory: number | null
  strategy: FetchStrategy
  imageMode: ImageMode
  useCache: boolean
} {
  const args = process.argv.slice(2)
  const result = {
    maxCategories: null as number | null,
    maxAlbumsPerCategory: null as number | null,
    strategy: DEFAULT_FETCH_STRATEGY as FetchStrategy,
    imageMode: DEFAULT_IMAGE_MODE as ImageMode,
    useCache: true,
  }

  for (const arg of args) {
    if (arg.startsWith('--max-categories=')) {
      result.maxCategories = parseInt(arg.split('=')[1])
    } else if (arg.startsWith('--max-albums=')) {
      result.maxAlbumsPerCategory = parseInt(arg.split('=')[1])
    } else if (arg.startsWith('--strategy=')) {
      result.strategy = arg.split('=')[1] as FetchStrategy
    } else if (arg.startsWith('--image-mode=')) {
      result.imageMode = arg.split('=')[1] as ImageMode
    } else if (arg === '--no-cache') {
      result.useCache = false
    }
  }

  return result
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main() {
  const opts = parseArgs()

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  NEXORA — Importador Profesional de Yupoo v2.0')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  console.log(`  Estrategia: ${opts.strategy}`)
  console.log(`  Modo imagen: ${opts.imageMode}`)
  console.log(`  Caché: ${opts.useCache ? 'activada' : 'desactivada'}`)
  console.log(`  Max categorías: ${opts.maxCategories || 'todas'}`)
  console.log(`  Max álbumes/cat: ${opts.maxAlbumsPerCategory || 'todos'}`)
  console.log('')

  // Asegurar que los directorios existen
  ensureDirs()

  // 1. ESCANEAR CATEGORÍAS
  console.log('📂 FASE 1: Escaneando categorías...')
  const categories = await scanCategories(opts.strategy)
  console.log(`   ✓ ${categories.length} categorías encontradas`)
  console.log('')

  if (categories.length === 0) {
    console.log('❌ No se encontraron categorías. Abortando.')
    return
  }

  // Limitar categorías si se especificó
  const catsToProcess = opts.maxCategories
    ? categories.slice(0, opts.maxCategories)
    : categories

  const startTime = Date.now()
  let totalProcessed = 0
  let totalSuccess = 0
  let totalFailed = 0
  let totalCached = 0

  // 2. PROCESAR CADA CATEGORÍA
  for (let catIdx = 0; catIdx < catsToProcess.length; catIdx++) {
    const cat = catsToProcess[catIdx]
    console.log(`\n📂 [${catIdx + 1}/${catsToProcess.length}] ${cat.name} (${cat.id})`)

    // Escanear álbumes de la categoría
    const scanResult = await scanAlbumsFromCategory(cat, undefined, opts.strategy)
    if (!scanResult.success || scanResult.albums.length === 0) {
      console.log(`   ⚠️  Sin álbumes`)
      continue
    }

    console.log(`   📦 ${scanResult.albums.length} álbumes descubiertos`)

    // Limitar álbumes si se especificó
    const albumsToProcess = opts.maxAlbumsPerCategory
      ? scanResult.albums.slice(0, opts.maxAlbumsPerCategory)
      : scanResult.albums

    // 3. PROCESAR CADA ÁLBUM
    for (let albIdx = 0; albIdx < albumsToProcess.length; albIdx++) {
      const albumRef = albumsToProcess[albIdx]
      totalProcessed++

      // Verificar caché
      if (opts.useCache) {
        // Primero hacer un fetch rápido para calcular hash
        // (por ahora siempre procesamos — el caché se activa en runs futuros)
      }

      // Parsear álbum
      const parseResult = await parseAlbum(albumRef, opts.strategy)

      if (!parseResult.success || !parseResult.album) {
        recordParseFailure(albumRef, parseResult.error || 'Error desconocido')
        totalFailed++
        continue
      }

      const album = parseResult.album

      // Calcular hash del álbum
      const albumHash = computeAlbumHash(album)

      // Verificar caché
      if (opts.useCache && isAlbumCached(albumRef.id, albumHash)) {
        totalCached++
        totalSuccess++
        continue
      }

      // Validar (FASE 2.5)
      const validation = validateAlbum(album)

      if (!validation.valid) {
        recordFailedAlbum(album, validation.errors)
        totalFailed++
        continue
      }

      // Generar ScrapedProduct
      const product = toScrapedProduct(album, opts.imageMode)

      // Guardar producto
      const productNum = getNextProductNumber()
      saveProduct(product, productNum)

      // Actualizar índice
      upsertIndexEntry({
        sku: product.sku,
        albumId: product.yupooAlbumId,
        file: productFileName(productNum),
        hash: product.albumHash,
        name: product.name,
        categoryId: product.yupooCategoryId,
        imageCount: product.imageHashes.length,
        createdAt: product.scrapedAt,
      })

      // Guardar en caché
      if (opts.useCache) {
        setAlbumCache({
          albumId: albumRef.id,
          contentHash: albumHash,
          processedAt: new Date().toISOString(),
          fetchMethod: parseResult.success ? 'http' : 'playwright',
          imageCount: album.images.length,
          videoCount: album.videos.length,
          albumName: album.name,
          productFile: productFileName(productNum),
        })
      }

      totalSuccess++

      // Log progreso
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
      process.stdout.write(
        `\r   ✓ [${albIdx + 1}/${albumsToProcess.length}] ${product.name.substring(0, 40).padEnd(42)} | ` +
        `${album.images.length} imgs | total: ${totalSuccess} ok, ${totalFailed} fail | ${elapsed}s   `
      )
    }
    console.log('')
  }

  // Cerrar browser
  await closeBrowser()

  // REPORTE FINAL
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('✅ Importación completada')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`   Tiempo total: ${elapsed} min`)
  console.log(`   Categorías procesadas: ${catsToProcess.length}`)
  console.log(`   Álbumes procesados: ${totalProcessed}`)
  console.log(`   ✓ Exitosos: ${totalSuccess}`)
  console.log(`   ✗ Fallidos: ${totalFailed}`)
  console.log(`   ⏭️  Caché (saltados): ${totalCached}`)
  console.log('')
  console.log(`   Productos guardados: ${countProducts()}`)
  console.log(`   Productos fallidos: ${countFailed()}`)
  console.log('═══════════════════════════════════════════════════════════════')
}

main()
  .catch((e) => {
    console.error('❌ Fatal:', e)
    process.exit(1)
  })
