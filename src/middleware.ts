import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())

const CSRF_EXEMPT = [
  '/api/csp-report',
  '/api/payments/stripe/webhook',
  '/api/payments/paypal/webhook',
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

function setSecurityHeaders(headers: Headers) {
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'SAMEORIGIN')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const start = Date.now()

  if (CSRF_EXEMPT.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    const response = NextResponse.next()
    setSecurityHeaders(response.headers)
    return response
  }

  if (pathname.startsWith('/api')) {
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentLength = request.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > MAX_BODY_BYTES) {
        return NextResponse.json({ error: 'Request too large' }, { status: 413 })
      }
    }

    const response = NextResponse.next()
    setSecurityHeaders(response.headers)
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
      return response
    }

    const referer = request.headers.get('referer')
    const ownOrigin = request.nextUrl.origin

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

    const duration = Date.now() - start
    if (duration > 100) {
      console.log(`[API] ${request.method} ${pathname} ${duration}ms`)
    }

    return response
  }

  const pageRes = NextResponse.next()
  setSecurityHeaders(pageRes.headers)
  pageRes.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.paypal.com https://accounts.google.com https://www.google.com https://www.gstatic.com",
    "frame-src https://js.stripe.com https://www.paypal.com https://accounts.google.com",
    "connect-src 'self' https://api.stripe.com https://www.paypal.com https://accounts.google.com",
    "img-src 'self' data: blob: https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "report-uri /api/csp-report",
  ].join('; '))
  return pageRes
}

export const config = {
  matcher: ['/', '/((?!api/|_next/|static/|favicon.ico).*)'],
}
