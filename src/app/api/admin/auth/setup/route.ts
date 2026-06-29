import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = verifyAdminToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const admin = await db.admin.findUnique({ where: { email: payload.email } })
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    if (admin.totpEnabled) {
      return NextResponse.json({ error: '2FA already enabled' }, { status: 400 })
    }

    const { generateTotpSecret, generateTotpQrCode } = await import('@/lib/totp')
    const secret = generateTotpSecret()
    const qrCode = await generateTotpQrCode(secret, admin.email)

    await db.admin.update({ where: { email: admin.email }, data: { totpSecret: secret } })

    return NextResponse.json({ secret, qrCode })
  } catch (e) {
    console.error('Setup 2FA error:', e)
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 })
  }
}
