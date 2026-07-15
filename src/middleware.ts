import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())

const CSRF_EXEMPT = [
  '/api/csp-report',
  '/api/payments/stripe/webhook',
  '/api/whatsapp/webhook',
  '/api/integrations/meta/webhook',
]

const MAX_BODY_BYTES = 500_000

function isValidOrigin(origin: string | null, requestOrigin?: string): boolean {
  if (!origin) return false
  if (requestOrigin && origin === requestOrigin) return true
  return ALLOWED_ORIGINS.some(allowed =>
    origin === allowed || origin === allowed.replace(/\/$/, '')
  )
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  for (let i = 0; i < 32; i++) {
    result += chars[array[i] % chars.length]
  }
  return result
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const start = Date.now()

  if (pathname.startsWith('/preview')) {
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    return response
  }

  if (CSRF_EXEMPT.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api')) {
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentLength = request.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > MAX_BODY_BYTES) {
        return NextResponse.json({ error: 'Request too large' }, { status: 413 })
      }
    }

    const response = NextResponse.next()
    const origin = request.headers.get('origin')

    if (origin && isValidOrigin(origin, request.nextUrl.origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-csrf-token')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    if (request.method === 'OPTIONS') {
      return response
    }

    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      if (!request.cookies.has('csrf-token')) {
        response.cookies.set('csrf-token', generateToken(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
        })
      }
      return response
    }

    const referer = request.headers.get('referer')
    const ownOrigin = request.nextUrl.origin

    if (!origin && !referer) {
      return NextResponse.next()
    }

    if (!origin && !referer) {
      console.warn('[CSRF] No origin or referer for', request.method, pathname)
      return NextResponse.next()
    }

    if (origin && !isValidOrigin(origin, ownOrigin)) {
      console.warn('[CSRF] Invalid origin:', origin, 'for', request.method, pathname)
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }

    if (!origin && referer) {
      try {
        const refererUrl = new URL(referer)
        if (!isValidOrigin(refererUrl.origin, ownOrigin)) {
          console.warn('[CSRF] Invalid referer:', referer, 'for', request.method, pathname)
          return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
        }
      } catch {
        console.warn('[CSRF] Invalid referer URL:', referer, 'for', request.method, pathname)
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
      }
    }

    const csrfCookie = request.cookies.get('csrf-token')?.value
    const csrfHeader = request.headers.get('x-csrf-token')
    if (csrfCookie && csrfHeader !== csrfCookie) {
      console.warn('[CSRF] Token mismatch for', request.method, pathname)
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
    }

    const duration = Date.now() - start
    if (duration > 100) {
      console.log(`[API] ${request.method} ${pathname} ${duration}ms`)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/preview', '/api/:path*'],
}
