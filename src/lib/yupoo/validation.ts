/**
 * NEXORA — Yupoo Importer · Validation (FASE 2.5)
 * ===================================================
 *
 * Módulo: src/lib/yupoo/validation.ts
 *
 * RESPONSABILIDAD
 * ---------------
 * Validar productos antes de guardarlos.
 * Los productos inválidos se guardan en data/failed.json
 * para revisión manual.
 *
 * REGLAS DE VALIDACIÓN
 * --------------------
 * 1. name: obligatorio, mínimo 3 caracteres, no vacío
 * 2. Al menos 1 imagen (imageHashes.length > 0)
 * 3. Categoría válida (yupooCategoryId no vacío y numérico)
 * 4. URL válida (yupooUrl con formato correcto)
 *
 * SI UN PRODUCTO FALLA
 * --------------------
 * - Se crea FailedProduct con errores detallados
 * - Se guarda en data/failed.json
 * - NO se guarda en data/products/
 */

import { isValidAlbumId, isValidCategoryId } from './config'
import type { YupooAlbum, ScrapedProduct, ValidationResult, ValidationError, FailedProduct } from './types'
import { addFailedProduct } from './storage'
import { isValidAlbumHref } from './scanner'

// ============================================================================
// VALIDACIÓN PRINCIPAL
// ============================================================================

/**
 * Valida un álbum scrapeado y genera un ScrapedProduct si es válido.
 *
 * @param album - Álbum a validar
 * @returns ValidationResult con producto (si válido) o errores
 */
export function validateAlbum(album: YupooAlbum): ValidationResult {
  const errors: ValidationError[] = []

  // 1. Validar nombre (title del card o name limpio)
  if (!album.name || album.name.trim().length < 3) {
    errors.push({
      type: 'MISSING_NAME',
      message: 'El álbum no tiene nombre o es muy corto (mínimo 3 caracteres)',
      value: album.name || album.title || '(vacío)',
    })
  }

  // 2. Validar imágenes
  if (!album.images || album.images.length === 0) {
    errors.push({
      type: 'MISSING_IMAGES',
      message: 'El álbum no tiene imágenes',
    })
  }

  // 3. Validar categoría
  if (!album.categoryId || !isValidCategoryId(album.categoryId)) {
    errors.push({
      type: 'INVALID_CATEGORY',
      message: 'Categoría inválida o faltante',
      value: album.categoryId || '(vacío)',
    })
  }

  // 4. Validar URL del álbum
  if (!album.url || !album.url.includes('yupoo.com/albums/')) {
    errors.push({
      type: 'INVALID_URL',
      message: 'URL del álbum inválida',
      value: album.url || '(vacía)',
    })
  }

  // 5. Validar que el href tenga uid= y referrercate=
  if (!isValidAlbumHref(album.href)) {
    errors.push({
      type: 'INVALID_URL',
      message: 'El href del álbum no contiene los parámetros obligatorios (uid= y referrercate=)',
      value: album.href || '(vacío)',
    })
  }

  // 6. Validar que el álbum existe
  if (!album.exists) {
    errors.push({
      type: 'ALBUM_NOT_FOUND',
      message: 'El álbum no existe en Yupoo (404)',
    })
  }

  // 7. Validar ID del álbum
  if (!isValidAlbumId(album.id)) {
    errors.push({
      type: 'INVALID_URL',
      message: 'ID de álbum inválido',
      value: album.id,
    })
  }

  // Si hay errores, retornar inválido
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      product: null,
    }
  }

  // Si es válido, generar ScrapedProduct
  const product: ScrapedProduct = {
    sku: `YP-${album.id}`,
    yupooAlbumId: album.id,
    yupooUrl: album.url,
    name: album.name,
    description: album.description,
    yupooCategoryId: album.categoryId,
    yupooCategoryName: album.categoryName,
    imageHashes: album.images.map((img) => img.hash),
    mainImageUrl: album.images[0]?.proxyUrl || '',
    galleryUrls: album.images.map((img) => img.proxyUrl),
    videoUrls: album.videos.map((v) => v.url),
    priceRaw: album.priceRaw,
    imageMode: 'proxy',
    albumHash: '', // se calcula fuera de esta función
    scrapedAt: album.scrapedAt,
  }

  return {
    valid: true,
    errors: [],
    product,
  }
}

// ============================================================================
// GUARDADO DE FALLIDOS
// ============================================================================

/**
 * Registra un álbum fallido en data/failed.json.
 *
 * @param album - Álbum que falló
 * @param errors - Errores de validación
 */
export function recordFailedAlbum(
  album: YupooAlbum,
  errors: ValidationError[]
): void {
  const failed: FailedProduct = {
    sku: `YP-${album.id}`,
    albumId: album.id,
    url: album.url,
    name: album.name || null,
    errors,
    failedAt: new Date().toISOString(),
    partialData: {
      imageCount: album.images.length,
      videoCount: album.videos.length,
      hasDescription: !!album.description,
      categoryId: album.categoryId || null,
    },
  }
  addFailedProduct(failed)
}

/**
 * Registra un álbum que no se pudo parsear (error de red, etc).
 *
 * @param albumRef - Referencia al álbum
 * @param errorMessage - Mensaje de error
 */
export function recordParseFailure(
  albumRef: { id: string; url: string },
  errorMessage: string
): void {
  const failed: FailedProduct = {
    sku: `YP-${albumRef.id}`,
    albumId: albumRef.id,
    url: albumRef.url,
    name: null,
    errors: [
      {
        type: 'PARSE_ERROR',
        message: errorMessage,
      },
    ],
    failedAt: new Date().toISOString(),
    partialData: {
      imageCount: 0,
      videoCount: 0,
      hasDescription: false,
      categoryId: null,
    },
  }
  addFailedProduct(failed)
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Crea un álbum "vacío" para casos de error.
 * Útil cuando no se pudo parsear pero queremos registrar el fallo.
 */
export function createEmptyAlbum(
  albumRef: { id: string; url: string; categoryId: string; href?: string; title?: string },
  error?: string
): YupooAlbum {
  return {
    id: albumRef.id,
    url: albumRef.url,
    href: albumRef.href || '',
    title: albumRef.title || '',
    name: '',
    description: null,
    categoryId: albumRef.categoryId,
    categoryName: null,
    photoCount: null,
    thumbnailHash: null,
    images: [],
    videos: [],
    priceRaw: null,
    fetchMethod: 'http',
    scrapedAt: new Date().toISOString(),
    exists: false,
  }
}
