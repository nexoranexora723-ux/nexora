/**
 * NEXORA — Yupoo Importer · Hashing
 * =====================================
 *
 * Módulo: src/lib/yupoo/hash.ts
 *
 * RESPONSABILIDAD
 * ---------------
 * Calcular hashes SHA-256 para detectar cambios en álbumes.
 * Si el hash de un álbum no cambia, no se re-procesa.
 *
 * QUÉ SE HASHEA
 * -------------
 * El contenido "significativo" del álbum:
 *   - Nombre del álbum
 *   - Descripción (si existe)
 *   - Lista de hashes de imágenes (en orden)
 *   - Lista de URLs de videos
 *
 * NO se hashea:
 *   - Timestamps (cambian siempre)
 *   - Metadata de scraping
 *   - URLs del proxy (son derivadas)
 */

import { createHash } from 'crypto'
import type { YupooAlbum } from './types'

/**
 * Calcula el hash SHA-256 de un álbum.
 *
 * El hash se calcula sobre una string normalizada que incluye:
 *   name|description|hash1,hash2,hash3|videoUrl1,videoUrl2
 *
 * @param album - Álbum hashear
 * @returns Hash hexadecimal de 64 caracteres
 */
export function computeAlbumHash(album: YupooAlbum): string {
  const parts = [
    album.name || '',
    album.description || '',
    album.images.map((img) => img.hash).join(','),
    album.videos.map((v) => v.url).join(','),
  ]
  const content = parts.join('|')
  return createHash('sha256').update(content).digest('hex')
}

/**
 * Calcula el hash de un contenido crudo (string).
 * Útil para hashear HTML antes de parsearlo.
 *
 * @param content - String a hashear
 * @returns Hash hexadecimal SHA-256
 */
export function hashString(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

/**
 * Compara dos hashes y determina si el álbum cambió.
 *
 * @param oldHash - Hash anterior (de la caché)
 * @param newHash - Hash nuevo (recién calculado)
 * @returns true si el álbum cambió (hashes diferentes)
 */
export function albumChanged(oldHash: string | null, newHash: string): boolean {
  if (!oldHash) return true // sin hash previo = nuevo
  return oldHash !== newHash
}
