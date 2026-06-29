import { NextResponse } from 'next/server'
import { verifyPassword, signAdminToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { email, password, totpToken } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const admin = await db.admin.findUnique({ where: { email } })
    if (!admin) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const valid = await verifyPassword(password, admin.password)
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    if (admin.totpEnabled) {
      if (!totpToken) return NextResponse.json({ totpRequired: true, adminId: admin.id }, { status: 200 })
      const { verifyTotpCode } = await import('@/lib/totp')
      if (!verifyTotpCode(totpToken, admin.totpSecret!)) return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 })
    }

    const token = signAdminToken({ adminId: admin.id, email: admin.email })
    return NextResponse.json({ token, user: { id: admin.id, email: admin.email, name: admin.name } })
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
