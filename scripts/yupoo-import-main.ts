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
  loadState,
  saveState,
  DEFAULT_FETCH_STRATEGY,
  DEFAULT_IMAGE_MODE,
  type FetchStrategy,
  type ImageMode,
  type YupooAlbumRef,
  type ScrapeState,
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
  startCategory: number | null
  endCategory: number | null
  batchSize: number | null
  resume: boolean
} {
  const args = process.argv.slice(2)
  const result = {
    maxCategories: null as number | null,
    maxAlbumsPerCategory: null as number | null,
    strategy: DEFAULT_FETCH_STRATEGY as FetchStrategy,
    imageMode: DEFAULT_IMAGE_MODE as ImageMode,
    useCache: true,
    startCategory: null as number | null,
    endCategory: null as number | null,
    batchSize: null as number | null,
    resume: false,
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
    } else if (arg.startsWith('--start-category=')) {
      result.startCategory = parseInt(arg.split('=')[1])
    } else if (arg.startsWith('--end-category=')) {
      result.endCategory = parseInt(arg.split('=')[1])
    } else if (arg.startsWith('--batch-size=')) {
      result.batchSize = parseInt(arg.split('=')[1])
    } else if (arg === '--resume') {
      result.resume = true
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
  if (opts.startCategory || opts.endCategory) {
    console.log(`  Batch: categorías ${opts.startCategory || 1}-${opts.endCategory || 'final'}`)
  }
  if (opts.resume) {
    console.log(`  Resume: activado`)
  }
  console.log('')

  // Asegurar que los directorios existen
  ensureDirs()

  // === FASE A: RESUME SYSTEM ===
  // Si --resume es utilizado, cargar estado previo y validar compatibilidad
  let resumeState: ScrapeState | null = null
  if (opts.resume) {
    resumeState = loadState()
    if (!resumeState) {
      console.log('❌ --resume solicitado pero NO existe data/.scrape-state.json')
      console.log('   No se puede continuar desde un estado previo.')
      console.log('   Ejecuta sin --resume para iniciar un nuevo scraping.')
      process.exit(1)
    }

    // Validar compatibilidad del batch
    const stateStart = resumeState.startCategoryIndex
    const stateEnd = resumeState.endCategoryIndex
    const currentStart = opts.startCategory ? opts.startCategory - 1 : 0 // convertir a 0-based
    const currentEnd = opts.endCategory ? opts.endCategory - 1 : undefined

    if (stateStart !== undefined && stateStart !== currentStart) {
      console.log(`❌ Incompatibilidad de batch: estado tiene startCategoryIndex=${stateStart}, actual=${currentStart}`)
      console.log('   No se puede mezclar estados de batches diferentes.')
      process.exit(1)
    }
    if (stateEnd !== undefined && currentEnd !== undefined && stateEnd !== currentEnd) {
      console.log(`❌ Incompatibilidad de batch: estado tiene endCategoryIndex=${stateEnd}, actual=${currentEnd}`)
      console.log('   No se puede mezclar estados de batches diferentes.')
      process.exit(1)
    }

    console.log(`↩️  Reanudando desde: categoría ${resumeState.lastCategoryIndex + 1}, álbum ${resumeState.lastAlbumId || 'inicio'}`)
    console.log(`   Procesados previamente: ${resumeState.totalProcessed} (${resumeState.totalSuccess} ok, ${resumeState.totalFailed} fail)`)
    console.log('')
  }

  // 1. ESCANEAR CATEGORÍAS
  console.log('📂 FASE 1: Escaneando categorías...')
  const categories = await scanCategories(opts.strategy)
  console.log(`   ✓ ${categories.length} categorías encontradas`)
  console.log('')

  if (categories.length === 0) {
    console.log('❌ No se encontraron categorías. Abortando.')
    return
  }

  // === FASE A: BATCH PROCESSING ===
  // Seleccionar rango de categorías según --start-category y --end-category
  // (1-based para el usuario, 0-based internamente)
  let catsToProcess: typeof categories
  if (opts.startCategory || opts.endCategory) {
    const start = (opts.startCategory ? opts.startCategory - 1 : 0) // 0-based
    const end = opts.endCategory ? opts.endCategory : categories.length // 1-based inclusive
    catsToProcess = categories.slice(start, end)
  } else if (opts.maxCategories) {
    catsToProcess = categories.slice(0, opts.maxCategories)
  } else {
    catsToProcess = categories
  }

  // Si hay resume, continuar desde la última categoría procesada
  const startCatIdx = resumeState ? resumeState.lastCategoryIndex : 0
  // Índice de álbum dentro de la categoría para resume granular
  let resumeAlbumIdx = resumeState?.currentAlbumIndex ?? 0

  const startTime = resumeState?.startedAt ? new Date(resumeState.startedAt).getTime() : Date.now()
  let totalProcessed = resumeState?.totalProcessed ?? 0
  let totalSuccess = resumeState?.totalSuccess ?? 0
  let totalFailed = resumeState?.totalFailed ?? 0
  let totalCached = 0
  let productsSinceCheckpoint = 0 // contador para guardar estado cada 100 productos

  // 2. PROCESAR CADA CATEGORÍA
  for (let catIdx = startCatIdx; catIdx < catsToProcess.length; catIdx++) {
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
    // Si es la primera categoría después de resume, comenzar desde el álbum guardado
    const albStart = (catIdx === startCatIdx) ? resumeAlbumIdx : 0
    resumeAlbumIdx = 0 // solo aplicar en la primera categoría
    for (let albIdx = albStart; albIdx < albumsToProcess.length; albIdx++) {
      const albumRef = albumsToProcess[albIdx]
      totalProcessed++

      // Verificar caché
      if (opts.useCache) {
        // Primero hacer un fetch rápido para calcular hash
        // (por ahora siempre procesamos — el caché se activa en runs futuros)
      }

      // Log info del álbum antes de procesar
      logger.debug(`  href: ${albumRef.href}`)
      logger.debug(`  title: ${albumRef.title}`)

      // Parsear álbum usando EXCLUSIVAMENTE albumRef.url (href exacto del DOM)
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
          fetchMethod: album.fetchMethod,
          imageCount: album.images.length,
          videoCount: album.videos.length,
          albumName: album.title || album.name,
          productFile: productFileName(productNum),
        })
      }

      totalSuccess++
      productsSinceCheckpoint++

      // === FASE A: GUARDAR ESTADO CADA 100 PRODUCTOS ===
      if (productsSinceCheckpoint >= 100) {
        productsSinceCheckpoint = 0
        const stateData: ScrapeState = {
          lastCategoryIndex: catIdx,
          lastAlbumId: albumRef.id,
          totalProcessed,
          totalSuccess,
          totalFailed,
          lastUpdate: new Date().toISOString(),
          startCategoryIndex: opts.startCategory ? opts.startCategory - 1 : 0,
          endCategoryIndex: opts.endCategory ? opts.endCategory - 1 : undefined,
          batchSize: opts.batchSize ?? undefined,
          currentAlbumIndex: albIdx,
          totalAlbumsInBatch: catsToProcess.length,
          percentComplete: Math.round((totalProcessed / (catsToProcess.length * (opts.maxAlbumsPerCategory || 120))) * 100),
          elapsedSeconds: Math.round((Date.now() - startTime) / 1000),
          startedAt: new Date(startTime).toISOString(),
        }
        saveState(stateData)
      }

      // === FASE A: PROGRESS DASHBOARD ===
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
      const displayName = album.title || album.name
      const albumsProcessed = albIdx + 1 - albStart
      const albumsPending = albumsToProcess.length - albumsProcessed
      const speedMs = parseResult.durationMs
      const speedSec = (speedMs / 1000).toFixed(2)
      const memMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0)
      const remainingAlbums = albumsPending
      const etaSec = (remainingAlbums * speedMs / 1000).toFixed(0)
      const etaMin = Math.round(parseFloat(etaSec.toString()) / 60)
      process.stdout.write(
        `\r   ✓ [${albIdx + 1}/${albumsToProcess.length}] ${displayName.substring(0, 40).padEnd(42)} | ` +
        `${album.images.length} imgs | ${album.videos.length} vids | ${speedSec}s/álbum | ` +
        `ETA: ${etaMin}min | ok:${totalSuccess} err:${totalFailed} | ${memMB}MB   `
      )
    }
    console.log('')
  }

  // === FASE A: GUARDAR ESTADO FINAL ===
  const finalState: ScrapeState = {
    lastCategoryIndex: catsToProcess.length,
    lastAlbumId: null,
    totalProcessed,
    totalSuccess,
    totalFailed,
    lastUpdate: new Date().toISOString(),
    startCategoryIndex: opts.startCategory ? opts.startCategory - 1 : 0,
    endCategoryIndex: opts.endCategory ? opts.endCategory - 1 : undefined,
    batchSize: opts.batchSize ?? undefined,
    currentAlbumIndex: 0,
    totalAlbumsInBatch: catsToProcess.length,
    percentComplete: 100,
    elapsedSeconds: Math.round((Date.now() - startTime) / 1000),
    startedAt: new Date(startTime).toISOString(),
  }
  saveState(finalState)

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
