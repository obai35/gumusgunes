import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/customer-auth'
import { generateTotpSecret, generateTotpQrCode } from '@/lib/totp'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = verifyToken(auth.slice(7))
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.totpEnabled) return NextResponse.json({ error: '2FA already enabled' }, { status: 400 })

  const secret = generateTotpSecret()
  const qrCode = await generateTotpQrCode(secret, user.email)

  await prisma.user.update({ where: { id: user.id }, data: { totpSecret: secret } })

  return NextResponse.json({ secret, qrCode })
}
