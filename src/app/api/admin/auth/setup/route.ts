import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import { signAdminSetupToken } from '@/lib/admin-auth'
import { getAdminFromToken } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

const handler = async (request: NextRequest) => {
  try {
    const admin = await getAdminFromToken(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const record = await db.admin.findUnique({ where: { id: admin.id } })
    if (!record) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    if (record.totpEnabled) {
      return NextResponse.json({ error: '2FA already enabled' }, { status: 400 })
    }

    const { generateTotpSecret, generateTotpQrCode } = await import('@/lib/totp')
    const secret = generateTotpSecret()
    const qrCode = await generateTotpQrCode(secret, record.email)

    // The secret is NOT persisted here. It travels only inside a short-lived
    // signed token and is committed only after the admin proves possession of
    // it via a valid authenticator code (see verify route).
    const setupToken = signAdminSetupToken(record.id, secret)

    return NextResponse.json({ secret, qrCode, setupToken })
  } catch (e) {
    console.error('Setup 2FA error:', e)
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 })
  }
}

export const POST = withRateLimit(handler, { limit: 5, window: '60s', failClosed: true })