import { NextResponse } from 'next/server'
import { Ratelimit, Duration } from '@upstash/ratelimit'
import { logger } from './logger'
import { Redis } from '@upstash/redis'

export interface RateLimitOptions {
  limit: number
  window: Duration
  identifier?: (req: Request) => string
  /** true = 429 when the limiter itself errors; false = fail open with a warning. Defaults to true. */
  failClosed?: boolean
}

export interface DualRateLimitOptions {
  limit: number
  window: Duration
  /** Per-account identifier (e.g. email parsed from the request body). */
  emailOf: (req: Request) => string | undefined | Promise<string | undefined>
  failClosed?: boolean
}

type ApiHandler = (req: Request, ...args: unknown[]) => unknown

export function hasRedisConfig(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

/**
 * Normalized client IP: the last (nearest trusted proxy) X-Forwarded-For hop,
 * then x-real-ip. Never the raw comma-joined chain — self-hosted proxies
 * (output: standalone) can append to it, and the full chain is client-influenced.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const last = xff
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .pop()
    if (last) return last
  }
  return req.headers.get('x-real-ip') || 'unknown'
}

function makeLimiter(limit: number, window: Duration) {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true,
  })
}

function tooManyRequests(reset: number, remaining: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.max(1, Math.ceil((reset - Date.now()) / 1000))),
        'X-RateLimit-Remaining': String(remaining),
      },
    }
  )
}

async function check(limiter: Ratelimit, identifier: string): Promise<NextResponse | null> {
  const { success, remaining, reset } = await limiter.limit(identifier)
  return success ? null : tooManyRequests(reset, remaining)
}

function wrap<T extends ApiHandler>(
  handler: T,
  failClosed: boolean,
  run: (req: Request) => Promise<NextResponse | null>
): T {
  const wrapped = async function (this: unknown, req: Request, ...args: unknown[]) {
    if (!hasRedisConfig()) {
      logger.warn('Rate limiting skipped: UPSTASH_REDIS_REST_URL/REST_TOKEN not configured')
      return handler(req, ...args)
    }
    try {
      const rejected = await run(req)
      if (rejected) return rejected
      return handler(req, ...args)
    } catch (err) {
      if (failClosed) {
        logger.warn({ err }, 'Rate limiting unavailable; failing closed')
        return NextResponse.json({ error: 'Rate limiting unavailable' }, { status: 429 })
      }
      logger.warn({ err }, 'Rate limiting unavailable; failing open')
      return handler(req, ...args)
    }
  }
  return wrapped as T
}

export function withRateLimit<T extends ApiHandler>(handler: T, options: RateLimitOptions): T {
  const failClosed = options.failClosed ?? true
  return wrap(handler, failClosed, async (req) => {
    const identifier = options.identifier ? options.identifier(req) : getClientIp(req)
    return check(makeLimiter(options.limit, options.window), identifier)
  })
}

/** OWASP dual buckets: per-IP AND per-account, each a full limit+window, stricter wins. */
export function withDualRateLimit<T extends ApiHandler>(handler: T, options: DualRateLimitOptions): T {
  const failClosed = options.failClosed ?? true
  return wrap(handler, failClosed, async (req) => {
    const limiter = makeLimiter(options.limit, options.window)
    const byIp = await check(limiter, `ip:${getClientIp(req)}`)
    if (byIp) return byIp
    const email = await options.emailOf(req)
    if (email) {
      const byEmail = await check(limiter, `email:${email}`)
      if (byEmail) return byEmail
    }
    return null
  })
}
