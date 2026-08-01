// NEXORA — Simple in-memory rate limiter for API routes
//
// Designed to be lightweight and dependency-free. Each "bucket" is keyed by
// IP + endpoint-group and stores a sliding window of request timestamps.
//
// NOTE: This is per-instance (in-memory). For multi-instance deployments you'd
// swap this with Redis, but for a single Next.js server on Vercel serverless
// functions this is a sufficient first-line defense against abuse.

interface RateLimitBucket {
  timestamps: number[]
}

const buckets = new Map<string, RateLimitBucket>()

// Prune expired entries every 5 minutes to prevent memory leaks.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
const WINDOW_MS = 60 * 1000 // 1 minute window
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS)
    if (bucket.timestamps.length === 0) {
      buckets.delete(key)
    }
  }
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // ms until the oldest request in the window expires
}

/**
 * Check and consume a rate-limit token.
 *
 * @param key     Unique identifier for the limiter (usually IP + endpoint group).
 * @param limit   Maximum number of requests allowed in the window.
 * @returns       Result with `success` flag and metadata.
 */
export function rateLimit(key: string, limit: number): RateLimitResult {
  cleanup()
  const now = Date.now()
  const bucket = buckets.get(key) ?? { timestamps: [] }

  // Drop timestamps outside the window.
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS)

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now
    const reset = Math.max(0, WINDOW_MS - (now - oldest))
    return {
      success: false,
      limit,
      remaining: 0,
      reset,
    }
  }

  bucket.timestamps.push(now)
  buckets.set(key, bucket)

  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - bucket.timestamps.length),
    reset: WINDOW_MS,
  }
}

/**
 * Extract a stable client IP from a Next.js Request.
 * Falls back to 'unknown' when no forwarding headers are present (e.g. local dev).
 */
export function getClientIP(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    // First IP in the list is the original client.
    return xff.split(',')[0]?.trim() ?? 'unknown'
  }
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}

/**
 * Convenience: enforce a rate limit on a Request, returning a 429 Response
 * when exceeded. Returns null when the request is allowed.
 *
 * @param req       The incoming Next.js Request.
 * @param group     A logical group (e.g. 'auth-login', 'orders').
 * @param limit     Max requests per minute.
 * @returns         null if allowed, or a 429 NextResponse-like Response if exceeded.
 */
export function enforceRateLimit(req: Request, group: string, limit: number): Response | null {
  const ip = getClientIP(req)
  const key = `${group}:${ip}`
  const result = rateLimit(key, limit)
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(result.reset / 1000)),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
        },
      },
    )
  }
  return null
}

// Pre-defined limit presets per the project spec.
export const RATE_LIMITS = {
  AUTH: 10, // 10 req/min for /api/auth/login, /api/auth/register
  WRITE: 30, // 30 req/min for /api/orders POST, /api/admin/*
  DEFAULT: 60,
} as const
