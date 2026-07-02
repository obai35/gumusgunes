import { NextRequest, NextResponse } from 'next/server'

type RateLimitOptions = {
  limit: number
  window: string
  identifier?: (req: NextRequest) => string
}

export function withRateLimit(
  handler: (req: NextRequest, ctx: { params: any }) => Promise<NextResponse>,
  options: RateLimitOptions
): (req: NextRequest, ctx: { params: any }) => Promise<NextResponse> {
  return async (req, ctx) => {
    try {
      const { Ratelimit } = await import('@upstash/ratelimit')
      const { Redis } = await import('@upstash/redis')

      const identifier = options.identifier
        ? options.identifier(req)
        : req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

      const redis = Redis.fromEnv()
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(options.limit, options.window),
        analytics: true,
      })

      const { success, limit, remaining, reset } = await ratelimit.limit(identifier)

      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': String(remaining),
            },
          }
        )
      }
    } catch (e) {
      console.warn('Rate limiting unavailable (Upstash may not be configured):', e)
    }

    return handler(req, ctx)
  }
}
