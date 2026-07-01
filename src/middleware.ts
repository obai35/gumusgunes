import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/preview')) {
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/preview',
}
