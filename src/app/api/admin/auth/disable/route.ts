import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { verifyTotpCode } from '@/lib/totp'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const payload = verifyAdminToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const admin = await db.admin.findUnique({ where: { id: payload.adminId } })
  if (!admin) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
  }

  const { token: totpCode } = await request.json()

  if (!admin.totpSecret) {
    return NextResponse.json({ error: '2FA not set up' }, { status: 400 })
  }

  if (!verifyTotpCode(totpCode, admin.totpSecret)) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  await db.admin.update({
    where: { id: admin.id },
    data: { totpSecret: null, totpEnabled: false },
  })

  return NextResponse.json({ success: true })
}
