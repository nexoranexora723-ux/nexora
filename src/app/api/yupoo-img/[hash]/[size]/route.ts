import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface CacheEntry {
  buffer: Uint8Array
  contentType: string
  etag: string
  timestamp: number
}

const imageCache = new Map<string, CacheEntry>()
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24h server-side cache
const MAX_CACHE = 100

function makeEtag(buffer: Uint8Array): string {
  // Weak ETag derived from buffer length + SHA-1 of contents.
  // Truncated to keep the header short. The "W/" prefix marks it as weak
  // (semantically equivalent, byte-for-byte differences allowed).
  const hash = createHash('sha1').update(buffer).digest('hex').slice(0, 16)
  return `W/"${buffer.length.toString(16)}-${hash}"`
}

function buildHeaders(entry: CacheEntry): HeadersInit {
  return {
    'Content-Type': entry.contentType,
    'Content-Length': String(entry.buffer.byteLength),
    // Immutable: browser/CDN caches can reuse without revalidation for 1 year.
    // The image content at a yupoo hash+size URL never changes.
    'Cache-Control': 'public, max-age=31536000, immutable',
    'ETag': entry.etag,
    'X-Content-Type-Options': 'nosniff',
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ hash: string; size: string }> },
) {
  try {
    const { hash, size } = await params

    if (!/^[a-f0-9]{6,40}$/i.test(hash)) {
      return NextResponse.json({ error: 'Invalid hash' }, { status: 400 })
    }
    const validSizes = ['small', 'medium', 'big', 'square', 'custom']
    if (!validSizes.includes(size)) {
      return NextResponse.json({ error: 'Invalid size' }, { status: 400 })
    }

    const cacheKey = `${hash}-${size}`
    const cached = imageCache.get(cacheKey)

    // === ETag / If-None-Match handling (browser cache → 304 Not Modified) ===
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const ifNoneMatch = req.headers.get('if-none-match')
      if (ifNoneMatch && ifNoneMatch === cached.etag) {
        // Client's cached version is still fresh — return 304 with no body.
        return new NextResponse(null, {
          status: 304,
          headers: {
            'ETag': cached.etag,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      }
      return new NextResponse(cached.buffer as unknown as BodyInit, {
        headers: buildHeaders(cached),
      })
    }

    // LRU-ish cleanup
    if (imageCache.size >= MAX_CACHE) {
      const entries = [...imageCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)
      for (let i = 0; i < 20 && i < entries.length; i++) {
        imageCache.delete(entries[i][0])
      }
    }

    const yupooUrl = `https://photo.yupoo.com/paypalshop/${hash}/${size}.jpg`
    const resp = await fetch(yupooUrl, {
      headers: {
        'Referer': 'https://paypalshop.x.yupoo.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    let imageBuffer: Uint8Array
    let contentType: string

    if (resp.ok) {
      imageBuffer = new Uint8Array(await resp.arrayBuffer())
      contentType = resp.headers.get('content-type') || 'image/jpeg'
    } else {
      const pngResp = await fetch(`https://photo.yupoo.com/paypalshop/${hash}/${size}.png`, {
        headers: {
          'Referer': 'https://paypalshop.x.yupoo.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })
      if (pngResp.ok) {
        imageBuffer = new Uint8Array(await pngResp.arrayBuffer())
        contentType = pngResp.headers.get('content-type') || 'image/png'
      } else {
        // Tiny 1x1 transparent PNG placeholder.
        const placeholder = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
        const phEtag = makeEtag(placeholder)
        return new NextResponse(placeholder as unknown as BodyInit, {
          headers: {
            'Content-Type': 'image/png',
            'Content-Length': String(placeholder.byteLength),
            'Cache-Control': 'public, max-age=3600',
            'ETag': phEtag,
          },
        })
      }
    }

    const etag = makeEtag(imageBuffer)
    const entry: CacheEntry = { buffer: imageBuffer, contentType, etag, timestamp: Date.now() }
    imageCache.set(cacheKey, entry)

    // Honor If-None-Match for freshly-fetched images too.
    const ifNoneMatch = req.headers.get('if-none-match')
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }

    return new NextResponse(imageBuffer as unknown as BodyInit, {
      headers: buildHeaders(entry),
    })
  } catch (error) {
    console.error('Yupoo image proxy error:', error)
    const placeholder = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
    const phEtag = makeEtag(placeholder)
    return new NextResponse(placeholder as unknown as BodyInit, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': String(placeholder.byteLength),
        'Cache-Control': 'public, max-age=3600',
        'ETag': phEtag,
      },
    })
  }
}
