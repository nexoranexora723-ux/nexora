/**
 * NEXORA — Yupoo Importer · Caché
 * ================================
 *
 * Módulo: src/lib/yupoo/cache.ts
 *
 * RESPONSABILIDAD
 * ---------------
 * Gestionar la caché de álbumes procesados.
 * Cada álbum tiene su propio archivo: cache/{albumId}.json
 *
 * ESTRATEGIA
 * ----------
 * 1. Antes de procesar un álbum, verificar si está en caché
 * 2. Si está, comparar hash del álbum actual con el de la caché
 * 3. Si el hash es igual, saltar (no re-procesar)
 * 4. Si el hash cambió o no hay caché, procesar y guardar
 *
 * FORMATO DE ARCHIVO
 * ------------------
 * cache/{albumId}.json → AlbumCacheEntry (ver types.ts)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { CACHE_DIR } from './config'
import type { AlbumCacheEntry } from './types'
import { albumChanged } from './hash'

// ============================================================================
// ASEGURAR DIRECTORIO
// ============================================================================

/** Asegura que el directorio cache/ existe */
export function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true })
  }
}

// ============================================================================
// LECTURA/ESCRITURA
// ============================================================================

/**
 * Obtiene la entrada de caché para un álbum.
 *
 * @param albumId - ID del álbum
 * @returns Entrada de caché o null si no existe
 */
export function getAlbumCache(albumId: string): AlbumCacheEntry | null {
  const file = `${CACHE_DIR}/${albumId}.json`
  if (!existsSync(file)) return null
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as AlbumCacheEntry
  } catch {
    return null
  }
}

/**
 * Guarda la entrada de caché para un álbum.
 *
 * @param entry - Entrada a guardar
 */
export function setAlbumCache(entry: AlbumCacheEntry): void {
  ensureCacheDir()
  const file = `${CACHE_DIR}/${entry.albumId}.json`
  writeFileSync(file, JSON.stringify(entry, null, 2))
}

// ============================================================================
// VERIFICACIONES
// ============================================================================

/**
 * Verifica si un álbum está en caché y NO ha cambiado.
 *
 * @param albumId - ID del álbum
 * @param currentHash - Hash actual del álbum (recién calculado)
 * @returns true si el álbum está en caché y sin cambios
 */
export function isAlbumCached(albumId: string, currentHash: string): boolean {
  const cached = getAlbumCache(albumId)
  if (!cached) return false
  return !albumChanged(cached.contentHash, currentHash)
}

/**
 * Verifica si un álbum está en caché (sin importar si cambió).
 *
 * @param albumId - ID del álbum
 * @returns true si existe entrada de caché
 */
export function hasAlbumCache(albumId: string): boolean {
  return getAlbumCache(albumId) !== null
}

// ============================================================================
// LIMPIEZA
// ============================================================================

/**
 * Elimina la caché de un álbum específico.
 *
 * @param albumId - ID del álbum
 */
export function clearAlbumCache(albumId: string): void {
  const file = `${CACHE_DIR}/${albumId}.json`
  if (existsSync(file)) {
    import('fs').then((fs) => fs.unlinkSync(file))
  }
}

/**
 * Cuenta cuántos álbumes están en caché.
 *
 * @returns Número de archivos de caché
 */
export function countCachedAlbums(): number {
  if (!existsSync(CACHE_DIR)) return 0
  import('fs').then((fs) => {
    const files = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith('.json'))
    return files.length
  })
  return 0
}

// ============================================================================
// LISTADO
// ============================================================================

/**
 * Lista todos los IDs de álbumes en caché.
 *
 * @returns Array de IDs
 */
export function listCachedAlbumIds(): string[] {
  if (!existsSync(CACHE_DIR)) return []
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs')
  return fs
    .readdirSync(CACHE_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''))
}
