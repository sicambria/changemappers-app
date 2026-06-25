import { createHmac, randomBytes } from 'node:crypto'
import { Ratelimit, type Duration } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let redisClient: Redis | null = null
let redisInitialized = false
const ratelimitByPolicy = new Map<string, Ratelimit>()

const inMemoryStore = new Map<string, { count: number; resetTime: number }>()

type RateLimitProvider = 'upstash' | 'memory'

// Lazily-generated, process-local fallback secret. Only used outside production
// when none of RATE_LIMIT_HASH_SECRET/AUTH_SECRET/JWT_SECRET are configured, so
// identifiers are still pseudonymized rather than hashed with a predictable key.
let devFallbackHashSecret: string | null = null

function getRateLimitHashSecret(): string {
  const configured = process.env.RATE_LIMIT_HASH_SECRET || process.env.AUTH_SECRET || process.env.JWT_SECRET
  if (configured) return configured

  if (process.env.NODE_ENV === 'production') {
    throw new Error('RATE_LIMIT_HASH_SECRET (or AUTH_SECRET/JWT_SECRET) must be set in production for rate-limit pseudonymization')
  }

  if (!devFallbackHashSecret) {
    devFallbackHashSecret = randomBytes(32).toString('hex')
    console.warn('RATE_LIMIT_HASH_SECRET, AUTH_SECRET, and JWT_SECRET are all unset — using a random per-process secret for rate-limit pseudonymization. Set RATE_LIMIT_HASH_SECRET for stable rate-limit buckets across restarts.')
  }
  return devFallbackHashSecret
}

export function pseudonymizeRateLimitIdentifier(identifier: string): string {
  return createHmac('sha256', getRateLimitHashSecret()).update(identifier).digest('hex')
}

/**
 * Returns true when the caller is running inside the E2E test harness.
 *
 * Requires BOTH conditions to be true:
 *   1. E2E_BYPASS_RATE_LIMIT=1  — explicit opt-in by the test runner
 *   2. NODE_ENV !== 'production' — hard guard; bypass NEVER activates in prod
 *
 * The former CI_E2E override (|| CI_E2E === '1') was removed because it
 * allowed rate-limit bypass in CI production builds and would have bypassed
 * rate limiting in real production if CI_E2E=1 leaked into the environment.
 * CI E2E tests that use NODE_ENV=production must accept real rate-limit
 * behaviour or spread requests across the window.
 */
function isE2EBypassActive(): boolean {
  return (
    process.env.E2E_BYPASS_RATE_LIMIT === '1' &&
    process.env.NODE_ENV !== 'production'
  )
}

const E2E_BYPASS_RESULT: RateLimitResult = { success: true, remaining: Infinity }

function isLocalProductionE2E(): boolean {
  if (process.env.NODE_ENV !== 'production' || process.env.CI_E2E !== '1') {
    return false
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL // SAFE: server-side E2E rate-limit policy checks public app URL host only.
  if (!appUrl) {
    return false
  }

  try {
    const hostname = new URL(appUrl).hostname.toLowerCase()
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  } catch {
    return false
  }
}

function toUpstashWindow(windowMs: number): Duration {
  return `${Math.max(1, Math.ceil(windowMs / 1000))} s` as Duration
}

function getRateLimitProvider(): RateLimitProvider {
  const configured = process.env.RATE_LIMIT_PROVIDER?.trim().toLowerCase()
  if (!configured) {
    return 'upstash'
  }
  if (configured === 'upstash' || configured === 'memory') {
    return configured
  }
  throw new Error(`Unsupported RATE_LIMIT_PROVIDER: ${process.env.RATE_LIMIT_PROVIDER}`)
}

function getRedisRatelimit(limit: number, windowMs: number): Ratelimit | null {
  if (getRateLimitProvider() === 'memory') {
    return null
  }

  if (redisInitialized && !redisClient) return null

  redisInitialized = true

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!redisUrl || !redisToken) {
    const msg = '[rate-limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set — using in-memory fallback. Rate limits will NOT be shared across instances.'
    if (process.env.NODE_ENV === 'production' && !isLocalProductionE2E()) {
      throw new Error(msg)
    }
    console.warn(msg)
    return null
  }

  const policyKey = `${limit}:${windowMs}`
  const existing = ratelimitByPolicy.get(policyKey)
  if (existing) {
    return existing
  }

  try {
    redisClient ??= new Redis({ url: redisUrl, token: redisToken })
    const ratelimit = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(limit, toUpstashWindow(windowMs)),
      analytics: false,
      prefix: 'changemappers',
    })
    ratelimitByPolicy.set(policyKey, ratelimit)
    return ratelimit
  } catch (error) {
    console.warn('[rate-limit] Failed to initialise Redis — using in-memory fallback:', error)
    return null
  }
}

export interface RateLimitResult {
  success: boolean
  remaining: number
}

/**
 * Synchronous in-memory rate limiter.
 *
 * Suitable for single-instance deployments and tests.
 * Use `rateLimitAsync` in server actions to get Upstash Redis support.
 */
export function rateLimit(
  identifier: string,
  limit = 5,
  windowMs = 60000
): RateLimitResult {
  if (isE2EBypassActive()) return E2E_BYPASS_RESULT
  return inMemoryRateLimit(identifier, limit, windowMs)
}

/**
 * Async rate limiter with Upstash Redis support.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set.
 * Falls back to in-process Map otherwise (suitable for single-instance / beta scale).
 *
 * @param identifier  Unique key, e.g. `login_<ip>`
 * @param limit       Max requests per window (in-memory fallback only)
 * @param windowMs    Window length in ms (in-memory fallback only)
 */
export async function rateLimitAsync(
  identifier: string,
  limit = 5,
  windowMs = 60000
): Promise<RateLimitResult> {
  if (isE2EBypassActive()) return E2E_BYPASS_RESULT

  const redisRatelimit = getRedisRatelimit(limit, windowMs)

  if (redisRatelimit) {
    try {
      const result = await redisRatelimit.limit(pseudonymizeRateLimitIdentifier(identifier))
      return { success: result.success, remaining: result.remaining }
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        throw error
      }
      console.warn('[rate-limit] Redis check failed — falling back to in-memory:', error)
    }
  }

  return inMemoryRateLimit(identifier, limit, windowMs)
}

function inMemoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const info = inMemoryStore.get(identifier)

  if (!info || now > info.resetTime) {
    inMemoryStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (info.count >= limit) {
    return { success: false, remaining: 0 }
  }

  inMemoryStore.set(identifier, { ...info, count: info.count + 1 })
  return { success: true, remaining: limit - (info.count + 1) }
}

// Periodically evict expired in-memory entries to prevent unbounded growth
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now()
      for (const [key, value] of inMemoryStore.entries()) {
        if (now > value.resetTime) {
          inMemoryStore.delete(key)
        }
      }
    },
    5 * 60 * 1000
  )
}
