/**
 * NEXORA — Yupoo Importer · Storage (Almacenamiento)
 * =====================================================
 *
 * Módulo: src/lib/yupoo/storage.ts
 *
 * RESPONSABILIDAD
 * ---------------
 * Gestionar el almacenamiento de productos en archivos individuales.
 *
 * ESTRUCTURA
 * ----------
 * data/
 * ├── products/
 * │   ├── 000001.json    ← producto individual
 * │   ├── 000002.json
 * │   ├── ...
 * │   └── index.json     ← índice con metadatos de todos
 * ├── failed.json        ← productos que fallaron validación
 * └── .scrape-state.json ← estado para resumir
 *
 * VENTAJAS
 * --------
 * - Reanudación granular (saber exactamente cuál falta)
 * - Procesamiento incremental
 * - No recargar todo en memoria
 * - Indexación rápida sin leer todos los archivos
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import {
  DATA_DIR,
  PRODUCTS_DIR,
  INDEX_FILE,
  FAILED_FILE,
  PRODUCT_FILE_PADDING,
} from './config'
import type { ScrapedProduct, ProductIndex, ProductIndexEntry, FailedProduct } from './types'

// ============================================================================
// ASEGURAR DIRECTORIOS
// ============================================================================

/** Asegura que data/ y data/products/ existen */
export function ensureDirs(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(PRODUCTS_DIR)) mkdirSync(PRODUCTS_DIR, { recursive: true })
}

// ============================================================================
// PRODUCTOS INDIVIDUALES
// ============================================================================

/**
 * Genera el nombre de archivo para un producto.
 * Ej: 1 → "000001.json", 42 → "000042.json"
 *
 * @param num - Número secuencial del producto
 * @returns Nombre de archivo
 */
export function productFileName(num: number): string {
  return `${String(num).padStart(PRODUCT_FILE_PADDING, '0')}.json`
}

/**
 * Genera la ruta completa del archivo de producto.
 *
 * @param num - Número secuencial
 * @returns Ruta: data/products/000001.json
 */
export function productFilePath(num: number): string {
  return `${PRODUCTS_DIR}/${productFileName(num)}`
}

/**
 * Guarda un producto en su archivo individual.
 *
 * @param product - Producto a guardar
 * @param num - Número secuencial
 * @returns Ruta del archivo guardado
 */
export function saveProduct(product: ScrapedProduct, num: number): string {
  ensureDirs()
  const path = productFilePath(num)
  writeFileSync(path, JSON.stringify(product, null, 2))
  return path
}

/**
 * Lee un producto desde su archivo individual.
 *
 * @param num - Número secuencial
 * @returns Producto o null si no existe
 */
export function loadProduct(num: number): ScrapedProduct | null {
  const path = productFilePath(num)
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as ScrapedProduct
  } catch {
    return null
  }
}

/**
 * Lee un producto por su nombre de archivo.
 *
 * @param fileName - Nombre como "000001.json"
 * @returns Producto o null
 */
export function loadProductByName(fileName: string): ScrapedProduct | null {
  const path = `${PRODUCTS_DIR}/${fileName}`
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as ScrapedProduct
  } catch {
    return null
  }
}

/**
 * Cuenta cuántos productos hay guardados.
 *
 * @returns Número de archivos .json en data/products/
 */
export function countProducts(): number {
  if (!existsSync(PRODUCTS_DIR)) return 0
  return readdirSync(PRODUCTS_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'index.json')
    .length
}

/**
 * Obtiene el siguiente número secuencial disponible.
 *
 * @returns Próximo número (ej: si hay 5 productos, retorna 6)
 */
export function getNextProductNumber(): number {
  return countProducts() + 1
}

// ============================================================================
// ÍNDICE (data/products/index.json)
// ============================================================================

/**
 * Lee el índice de productos.
 * Si no existe, retorna un índice vacío.
 */
export function loadIndex(): ProductIndex {
  if (!existsSync(INDEX_FILE)) {
    return {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      total: 0,
      entries: [],
    }
  }
  try {
    return JSON.parse(readFileSync(INDEX_FILE, 'utf8')) as ProductIndex
  } catch {
    return {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      total: 0,
      entries: [],
    }
  }
}

/**
 * Guarda el índice de productos.
 *
 * @param index - Índice a guardar
 */
export function saveIndex(index: ProductIndex): void {
  ensureDirs()
  index.updatedAt = new Date().toISOString()
  index.total = index.entries.length
  writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2))
}

/**
 * Agrega una entrada al índice (o actualiza si ya existe).
 *
 * @param entry - Entrada a agregar/actualizar
 */
export function upsertIndexEntry(entry: ProductIndexEntry): void {
  const index = loadIndex()
  const existingIdx = index.entries.findIndex((e) => e.albumId === entry.albumId)
  if (existingIdx >= 0) {
    index.entries[existingIdx] = entry
  } else {
    index.entries.push(entry)
  }
  saveIndex(index)
}

/**
 * Busca una entrada en el índice por albumId.
 *
 * @param albumId - ID del álbum
 * @returns Entrada o null
 */
export function findInIndex(albumId: string): ProductIndexEntry | null {
  const index = loadIndex()
  return index.entries.find((e) => e.albumId === albumId) || null
}

// ============================================================================
// PRODUCTOS FALLIDOS (data/failed.json)
// ============================================================================

/**
 * Lee la lista de productos fallidos.
 * Si no existe, retorna array vacío.
 */
export function loadFailed(): FailedProduct[] {
  if (!existsSync(FAILED_FILE)) return []
  try {
    return JSON.parse(readFileSync(FAILED_FILE, 'utf8')) as FailedProduct[]
  } catch {
    return []
  }
}

/**
 * Guarda la lista completa de productos fallidos.
 *
 * @param failed - Lista a guardar
 */
export function saveFailed(failed: FailedProduct[]): void {
  ensureDirs()
  writeFileSync(FAILED_FILE, JSON.stringify(failed, null, 2))
}

/**
 * Agrega un producto fallido a la lista.
 *
 * @param failed - Producto fallido a agregar
 */
export function addFailedProduct(failed: FailedProduct): void {
  const all = loadFailed()
  // No duplicar por albumId
  const existing = all.findIndex((f) => f.albumId === failed.albumId)
  if (existing >= 0) {
    all[existing] = failed
  } else {
    all.push(failed)
  }
  saveFailed(all)
}

/**
 * Cuenta cuántos productos fallidos hay.
 */
export function countFailed(): number {
  return loadFailed().length
}

// ============================================================================
// ESTADÍSTICAS GENERALES
// ============================================================================

/**
 * Obtiene estadísticas resumidas del almacenamiento.
 */
export function getStorageStats(): {
  totalProducts: number
  totalFailed: number
  totalCached: number
  indexSize: number
} {
  const index = loadIndex()
  return {
    totalProducts: countProducts(),
    totalFailed: countFailed(),
    totalCached: 0, // se calcula desde cache.ts
    indexSize: index.entries.length,
  }
}
