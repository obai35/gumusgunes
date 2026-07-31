import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'
import { hashPassword, signToken } from '@/lib/customer-auth'
import { encryptFields } from '@/lib/field-encryption'
import { db } from '@/lib/db'
import { storefrontDb } from '@/lib/storefront-db'
import { z } from 'zod'

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  return NextResponse.json({ enabled: !!clientId, clientId: clientId || null })
}

const GoogleAuthSchema = z.object({
  credential: z.string().min(1, 'Missing credential'),
}).strict()

const handler = async (req: NextRequest) => {
  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
    if (!GOOGLE_CLIENT_ID) return NextResponse.json({ error: 'Google login not configured' }, { status: 501 })

    const parsed = GoogleAuthSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing credential' }, { status: 400 })
    }
    const { credential } = parsed.data

    const ticketRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`)
    if (!ticketRes.ok) return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 })
    const payload = await ticketRes.json()

    if (payload.aud !== GOOGLE_CLIENT_ID) return NextResponse.json({ error: 'Invalid audience' }, { status: 401 })

    const email = payload.email
    const name = payload.name || email?.split('@')[0] || 'User'
    const googleId = payload.sub

    let user = await db.user.findUnique({ where: { email } })
    if (user) {
      if (!user.googleId) await db.user.update({ where: { id: user.id }, data: { googleId } })
    } else {
      const { storeId } = await storefrontDb(req)
      user = await db.user.create({
        data: encryptFields(
          { email, name, googleId, password: await hashPassword(crypto.randomUUID()), storeId },
          ['name']
        ),
      })
    }

    if (user.totpEnabled) {
      return NextResponse.json({ totpRequired: true, userId: user.id, email: user.email })
    }

    const token = signToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion })
    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
    response.cookies.set('__session', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', path: '/api', maxAge: 604800,
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Google login failed' }, { status: 500 })
  }
}

export const POST = withRateLimit(handler, { limit: 5, window: '60s' })
