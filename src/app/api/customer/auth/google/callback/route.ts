import { NextRequest, NextResponse } from 'next/server'
import { signToken, signTotpTempToken, TEMP_TOKEN_COOKIE } from '@/lib/customer-auth'
import { db } from '@/lib/db'
import { storefrontDb } from '@/lib/storefront-db'

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin

  try {
    const code = req.nextUrl.searchParams.get('code')
    if (!code) {
      return NextResponse.redirect(new URL('/login?error=google_no_code', origin))
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/customer/auth/google/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/login?error=google_config', origin))
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/login?error=google_token', origin))
    }

    const tokens: { access_token: string; id_token?: string } = await tokenRes.json()

    let email = ''
    let name = ''
    let avatar: string | null = null

    try {
      const profileRes = await fetch('https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      if (profileRes.ok) {
        const data = await profileRes.json()
        email = data.emailAddresses?.[0]?.value || ''
        name = data.names?.[0]?.displayName || ''
        avatar = data.photos?.[0]?.url || null
      }
    } catch {}

    if (!email) {
      try {
        const infoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${tokens.access_token}`)
        if (infoRes.ok) {
          const info = await infoRes.json()
          email = info.email || ''
        }
      } catch {}
    }

    if (tokens.id_token) {
      const parts = tokens.id_token.split('.')
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
          email = email || payload.email || ''
          name = name || payload.name || payload.given_name || ''
          avatar = avatar || payload.picture || null
        } catch {}
      }
    }

    if (!email) {
      return NextResponse.redirect(new URL('/login?error=google_no_email', origin))
    }

    const googleSub = (() => {
      if (!tokens.id_token) return email
      try {
        const parts = tokens.id_token.split('.')
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
        return payload.sub || email
      } catch { return email }
    })()

    const { storeId } = await storefrontDb(req)
    const user = await db.user.upsert({
      where: { email },
      update: {
        googleId: googleSub,
        name: name || undefined,
        avatar: avatar || undefined,
      },
      create: {
        email,
        name,
        password: '',
        googleId: googleSub,
        avatar,
        storeId,
      },
    })

    if (user.totpEnabled) {
      const tempToken = signTotpTempToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion })
      const pendingRedirect = NextResponse.redirect(new URL('/login?2fa=pending', origin))
      pendingRedirect.cookies.set(TEMP_TOKEN_COOKIE, tempToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 5 * 60,
      })
      return pendingRedirect
    }

    const jwtToken = signToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion })
    const response = NextResponse.redirect(new URL('/?google_login=success', origin))

    response.cookies.set('__session', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api',
      maxAge: 604800,
    })

    return response
  } catch (e) {
    console.error('Google callback error:', e)
    return NextResponse.redirect(new URL('/login?error=google_failed', origin))
  }
}
