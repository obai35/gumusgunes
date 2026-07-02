import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { signToken } from '@/lib/customer-auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    if (!code) {
      return NextResponse.redirect(new URL('/auth/login?error=no_code', req.url))
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/customer/auth/google/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/auth/login?error=config', req.url))
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    const people = google.people({ version: 'v1', auth: oauth2Client })
    const profile = await people.people.get({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,photos,birthdays,phoneNumbers',
    })

    const data = profile.data
    const email = data.emailAddresses?.[0]?.value || ''
    const name = data.names?.[0]?.displayName || ''
    const avatar = data.photos?.[0]?.url || null
    const birthday = data.birthdays?.[0]?.date
    const phone = data.phoneNumbers?.[0]?.value || null

    if (!email) {
      return NextResponse.redirect(new URL('/auth/login?error=no_email', req.url))
    }

    let dateOfBirth: Date | null = null
    if (birthday?.year && birthday?.month && birthday?.day) {
      dateOfBirth = new Date(birthday.year, birthday.month - 1, birthday.day)
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
    const response = NextResponse.redirect(new URL('/?google_login=success', req.url))

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
    return NextResponse.redirect(new URL('/auth/login?error=google_failed', req.url))
  }
}
