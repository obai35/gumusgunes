import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { hashPassword, signToken } from '@/lib/customer-auth'

const prisma = new PrismaClient()

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  return NextResponse.json({ enabled: !!clientId, clientId: clientId || null })
}

export async function POST(req: Request) {
  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
    if (!GOOGLE_CLIENT_ID) return NextResponse.json({ error: 'Google login not configured' }, { status: 501 })

    const { credential } = await req.json()
    if (!credential) return NextResponse.json({ error: 'Missing credential' }, { status: 400 })

    const ticketRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`)
    if (!ticketRes.ok) return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 })
    const payload = await ticketRes.json()

    if (payload.aud !== GOOGLE_CLIENT_ID) return NextResponse.json({ error: 'Invalid audience' }, { status: 401 })

    const email = payload.email
    const name = payload.name || email?.split('@')[0] || 'User'
    const googleId = payload.sub

    let user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      if (!user.googleId) await prisma.user.update({ where: { id: user.id }, data: { googleId } })
    } else {
      user = await prisma.user.create({
        data: { email, name, googleId, password: await hashPassword(crypto.randomUUID()) },
      })
    }

    if (user.totpEnabled) {
      return NextResponse.json({ totpRequired: true, userId: user.id, email: user.email })
    }

    const token = signToken({ userId: user.id, email: user.email })
    return NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name } })
  } catch {
    return NextResponse.json({ error: 'Google login failed' }, { status: 500 })
  }
}
