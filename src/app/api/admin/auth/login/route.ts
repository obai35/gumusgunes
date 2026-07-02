import { NextResponse } from 'next/server'
import { verifyPassword, signAdminToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { email, password, totpToken } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const admin = await db.admin.findUnique({ where: { email }, include: { roleRel: true } })
    if (!admin) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const valid = await verifyPassword(password, admin.password)
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    if (admin.totpEnabled) {
      if (!totpToken) return NextResponse.json({ totpRequired: true, adminId: admin.id }, { status: 200 })
      const { verifyTotpCode } = await import('@/lib/totp')
      if (!verifyTotpCode(totpToken, admin.totpSecret!)) return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 })
    }

    const token = signAdminToken({ adminId: admin.id, email: admin.email })
    const permissions = admin.roleRel ? JSON.parse(admin.roleRel.permissions) : []

    const response = NextResponse.json({
      user: { id: admin.id, email: admin.email, name: admin.name, role: admin.roleRel?.name || 'admin', permissions }
    })

    response.cookies.set('__session_admin', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api',
      maxAge: 86400,
    })

    return response
  } catch (e) {
    console.error('Login error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Login failed' }, { status: 500 })
  }
}
