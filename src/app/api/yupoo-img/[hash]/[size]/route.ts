import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const imageCache = new Map<string, { buffer: Uint8Array; contentType: string; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 * 24
const MAX_CACHE = 100

export async function GET(
  _req: Request,
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
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new NextResponse(cached.buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }

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
        const placeholder = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
        return new NextResponse(placeholder as unknown as BodyInit, {
          headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' },
        })
      }
    }

    imageCache.set(cacheKey, { buffer: imageBuffer, contentType, timestamp: Date.now() })

    return new NextResponse(imageBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('Yupoo image proxy error:', error)
    const placeholder = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
    return new NextResponse(placeholder as unknown as BodyInit, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' },
    })
  }
}
