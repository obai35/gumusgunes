import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const state = vi.hoisted(() => ({
  instances: [] as Array<{ limit: ReturnType<typeof vi.fn> }>,
  behavior: {
    result: { success: true, remaining: 9, reset: 0 } as { success: boolean; remaining: number; reset: number },
    failWith: null as Error | null,
  },
}))

vi.mock('@upstash/redis', () => ({
  Redis: { fromEnv: vi.fn(() => ({})) },
}))

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn(() => ({}))
    limit = vi.fn(async () => {
      if (state.behavior.failWith) throw state.behavior.failWith
      return state.behavior.result
    })
    constructor() {
      state.instances.push(this)
    }
  },
}))

import { withRateLimit, withDualRateLimit, getClientIp, hasRedisConfig } from './rate-limit'
import { logger } from './logger'

function postRequest(xff?: string, body?: string): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (xff) headers['x-forwarded-for'] = xff
  return new Request('http://localhost:3000/api/x', {
    method: 'POST',
    headers,
    body: body ?? JSON.stringify({ email: 'user@example.com', password: 'pw' }),
  })
}

describe('getClientIp', () => {
  it('takes the last (nearest proxy) X-Forwarded-For hop', () => {
    expect(getClientIp(postRequest('1.2.3.4, 5.6.7.8'))).toBe('5.6.7.8')
  })

  it('handles a single X-Forwarded-For value', () => {
    expect(getClientIp(postRequest('9.9.9.9'))).toBe('9.9.9.9')
  })

  it('falls back to x-real-ip', () => {
    const req = new Request('http://localhost:3000/api/x', { headers: { 'x-real-ip': '10.0.0.1' } })
    expect(getClientIp(req)).toBe('10.0.0.1')
  })

  it('defaults to unknown when no IP headers exist', () => {
    expect(getClientIp(new Request('http://localhost:3000/api/x'))).toBe('unknown')
  })
})

describe('hasRedisConfig', () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('is false when Upstash envs are unset', () => {
    expect(hasRedisConfig()).toBe(false)
  })

  it('is true when both Upstash envs are set', () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://x'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'y'
    expect(hasRedisConfig()).toBe(true)
  })
})

describe('withRateLimit', () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    state.instances.length = 0
    state.behavior.failWith = null
    state.behavior.result = { success: true, remaining: 9, reset: Date.now() + 1000 }
    vi.restoreAllMocks()
  })

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('fails open with a warning when Upstash is not configured', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const handler = vi.fn(async (_req: Request) => new Response('ok', { status: 200 }))
    const wrapped = withRateLimit(handler, { limit: 5, window: '30s' })

    const res = await wrapped(postRequest())

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not configured'))
  })

  it('returns 429 with Retry-After and X-RateLimit-Remaining when limited', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://x'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'y'
    state.behavior.result = { success: false, remaining: 0, reset: Date.now() + 30000 }
    const handler = vi.fn(async (_req: Request) => new Response('ok', { status: 200 }))
    const wrapped = withRateLimit(handler, { limit: 5, window: '30s' })

    const res = await wrapped(postRequest('1.2.3.4'))

    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('30')
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(handler).not.toHaveBeenCalled()
  })

  it('uses the last X-Forwarded-For hop as the default identifier', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://x'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'y'
    const handler = vi.fn(async (_req: Request) => new Response('ok', { status: 200 }))
    const wrapped = withRateLimit(handler, { limit: 5, window: '30s' })

    await wrapped(postRequest('1.2.3.4, 5.6.7.8'))

    const limiter = state.instances.at(-1)
    expect(limiter!.limit).toHaveBeenCalledWith('5.6.7.8')
  })

  it('fails closed (429) when the limiter errors and failClosed is true', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://x'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'y'
    state.behavior.failWith = new Error('redis down')
    const handler = vi.fn(async (_req: Request) => new Response('ok', { status: 200 }))
    const wrapped = withRateLimit(handler, { limit: 5, window: '30s', failClosed: true })

    const res = await wrapped(postRequest())

    expect(res.status).toBe(429)
    expect(handler).not.toHaveBeenCalled()
  })

  it('fails open when the limiter errors and failClosed is false', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://x'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'y'
    state.behavior.failWith = new Error('redis down')
    const handler = vi.fn(async (_req: Request) => new Response('ok', { status: 200 }))
    const wrapped = withRateLimit(handler, { limit: 5, window: '30s', failClosed: false })

    const res = await wrapped(postRequest())

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('withDualRateLimit', () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    state.instances.length = 0
    state.behavior.failWith = null
    state.behavior.result = { success: true, remaining: 9, reset: Date.now() + 1000 }
    process.env.UPSTASH_REDIS_REST_URL = 'https://x'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'y'
  })

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('checks both per-IP and per-email buckets (2 limit calls)', async () => {
    const handler = vi.fn(async (_req: Request) => new Response('ok', { status: 200 }))
    const wrapped = withDualRateLimit(handler, {
      limit: 5,
      window: '30s',
      emailOf: async (req) => (await req.clone().json().catch(() => null))?.email,
    })

    await wrapped(postRequest('1.2.3.4'))

    const limiter = state.instances.at(-1)
    expect(limiter!.limit).toHaveBeenCalledTimes(2)
    expect(limiter!.limit).toHaveBeenNthCalledWith(1, 'ip:1.2.3.4')
    expect(limiter!.limit).toHaveBeenNthCalledWith(2, 'email:user@example.com')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('checks only the IP bucket when no email can be parsed', async () => {
    const handler = vi.fn(async (_req: Request) => new Response('ok', { status: 200 }))
    const wrapped = withDualRateLimit(handler, {
      limit: 5,
      window: '30s',
      emailOf: async () => undefined,
    })

    await wrapped(postRequest('1.2.3.4'))

    const limiter = state.instances.at(-1)
    expect(limiter!.limit).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('rejects when the per-email bucket is exhausted, before the handler runs', async () => {
    state.behavior.result = { success: false, remaining: 0, reset: Date.now() + 30000 }
    const handler = vi.fn(async (_req: Request) => new Response('ok', { status: 200 }))
    const wrapped = withDualRateLimit(handler, {
      limit: 5,
      window: '30s',
      emailOf: async (req) => (await req.clone().json().catch(() => null))?.email,
    })

    const res = await wrapped(postRequest('1.2.3.4'))

    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('30')
    expect(handler).not.toHaveBeenCalled()
  })

  it('rejects when the per-IP bucket is exhausted, even with a fresh email', async () => {
    state.behavior.result = { success: false, remaining: 0, reset: Date.now() + 30000 }
    const handler = vi.fn(async (_req: Request) => new Response('ok', { status: 200 }))
    const wrapped = withDualRateLimit(handler, {
      limit: 5,
      window: '30s',
      emailOf: async () => 'other@example.com',
    })

    const res = await wrapped(postRequest('1.2.3.4'))

    expect(res.status).toBe(429)
    expect(handler).not.toHaveBeenCalled()
  })
})
