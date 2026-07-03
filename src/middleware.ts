import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())

function isValidOrigin(origin: string | null): boolean {
  if (!origin) return false
  return ALLOWED_ORIGINS.some(allowed =>
    origin === allowed || origin === allowed.replace(/\/$/, '')
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/preview')) {
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    return response
  }

  if (pathname === '/api/csp-report') {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api')) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return NextResponse.next()
    }

    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')

    if (!origin && !referer) {
      return NextResponse.next()
    }

    if (origin && !isValidOrigin(origin)) {
      console.warn('[CSRF] Invalid origin:', origin)
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }

    if (!origin && referer) {
      try {
        const refererUrl = new URL(referer)
        if (!isValidOrigin(refererUrl.origin)) {
          console.warn('[CSRF] Invalid referer:', referer)
          return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
        }
      } catch {
        console.warn('[CSRF] Invalid referer URL:', referer)
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/preview', '/api/:path*'],
}
