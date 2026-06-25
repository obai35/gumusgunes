import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/customer-auth'
import { verifyTotpCode } from '@/lib/totp'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = verifyToken(auth.slice(7))
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user || !user.totpSecret) return NextResponse.json({ error: '2FA not set up' }, { status: 400 })

    if (!verifyTotpCode(token, user.totpSecret)) return NextResponse.json({ error: 'Invalid code' }, { status: 400 })

    await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
