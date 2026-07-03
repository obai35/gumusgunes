import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { signToken } from '@/lib/customer-auth'
import { db } from '@/lib/db'

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

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    let email = ''
    let name = ''
    let avatar: string | null = null
    let phone: string | null = null
    let dateOfBirth: Date | null = null

    try {
      const people = google.people({ version: 'v1', auth: oauth2Client })
      const profile = await people.people.get({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses,photos',
      })
      const data = profile.data
      email = data.emailAddresses?.[0]?.value || ''
      name = data.names?.[0]?.displayName || ''
      avatar = data.photos?.[0]?.url || null
    } catch {
      const tokenInfo = await oauth2Client.getTokenInfo(tokens.access_token!)
      email = tokenInfo.email || ''
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

    const user = await db.user.upsert({
      where: { email },
      update: {
        googleId: tokens.id_token || email,
        name: name || undefined,
        avatar: avatar || undefined,
        dateOfBirth: dateOfBirth || undefined,
        phone: phone || undefined,
      },
      create: {
        email,
        name,
        password: '',
        googleId: tokens.id_token || email,
        avatar,
        dateOfBirth,
        phone,
      },
    })

    const jwtToken = signToken({ userId: user.id, email: user.email })
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
