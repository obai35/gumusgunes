import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()
const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10s'),
  analytics: true,
})

interface RateLimitOptions {
  limit: number
  window: string
  identifier?: (req: Request) => string
  failClosed?: boolean
}

export function withRateLimit<T extends (...args: any[]) => any>(
  handler: T,
  options: RateLimitOptions
): T {
  const wrapped = async function (this: any, req: Request, ...args: unknown[]) {
    try {
      const identifier = options.identifier?.(req) ?? req.headers.get('x-forwarded-for') ?? 'unknown'
      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(options.limit, options.window),
        analytics: true,
      })
      const { success, remaining, reset } = await limiter.limit(identifier)
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
              'X-RateLimit-Remaining': String(remaining),
            },
          }
        )
      }
      return handler(req, ...args)
    } catch (err) {
      console.warn('[rate-limit] Unavailable:', err)
      if (options.failClosed) {
        return NextResponse.json(
          { error: 'Rate limiting unavailable' },
          { status: 429 }
        )
      }
      return handler(req, ...args)
    }
  }
  return wrapped as T
}
