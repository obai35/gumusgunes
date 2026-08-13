import { NextRequest, NextResponse } from 'next/server'
import { withDualRateLimit } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/api-error'
import { verifyPassword, signAdminToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
import { lockedFor, recordFailedAttempt, resetFailedAttempts } from '@/lib/lockout'
import { z } from 'zod'

const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().length(6).optional(),
}).strict()

const handler = async (req: NextRequest) => {
  try {
    const parsed = AdminLoginSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { email, password, totpCode: totpToken } = parsed.data

    const admin = await db.admin.findUnique({ where: { email }, include: { roleRel: true } })
    if (!admin) {
      await logAudit({
        adminId: 'unknown',
        action: 'admin_login_failed',
        resource: 'auth',
        storeId: 'unknown',
        details: { email, reason: 'invalid credentials' },
      })
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const lockedSeconds = lockedFor(admin)
    if (lockedSeconds !== null) {
      return NextResponse.json(
        { error: 'Account temporarily locked. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(lockedSeconds) } }
      )
    }

    const valid = await verifyPassword(password, admin.password)
    if (!valid) {
      const { attempts } = await recordFailedAttempt(admin, (data) => db.admin.update({ where: { id: admin.id }, data })).catch(() => ({ attempts: admin.failedLoginAttempts + 1, locked: false }))
      await logAudit({
        adminId: admin.id,
        action: 'admin_login_failed',
        resource: 'auth',
        storeId: admin.storeId,
        details: { email, reason: 'invalid password', attempts },
      })
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (admin.totpEnabled) {
      if (!totpToken) return NextResponse.json({ totpRequired: true }, { status: 200 })
      const { verifyTotpCode } = await import('@/lib/totp')
      if (!verifyTotpCode(totpToken, admin.totpSecret!)) {
        const { attempts } = await recordFailedAttempt(admin, (data) => db.admin.update({ where: { id: admin.id }, data })).catch(() => ({ attempts: admin.failedLoginAttempts + 1, locked: false }))
        await logAudit({
          adminId: admin.id,
          action: 'admin_login_failed',
          resource: 'auth',
          storeId: admin.storeId,
          details: { email, reason: 'invalid 2fa code', attempts },
        })
        return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 })
      }
    }

    await resetFailedAttempts((data) => db.admin.update({ where: { id: admin.id }, data })).catch(() => {})

    await logAudit({
      adminId: admin.id,
      action: 'admin_login',
      resource: 'auth',
      resourceId: admin.id,
      storeId: admin.storeId,
      details: { email: admin.email },
    })

    db.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } }).catch(() => {})

    const token = signAdminToken(admin.id, admin.email, admin.storeId, admin.tokenVersion || 0)
    const permissions = admin.roleRel ? JSON.parse(admin.roleRel.permissions) : []
    const store = await db.store.findUnique({ where: { id: admin.storeId }, select: { id: true, name: true } })

    const response = NextResponse.json({
      user: { id: admin.id, email: admin.email, name: admin.name, role: admin.roleRel?.name || 'admin', permissions, storeId: admin.storeId, storeName: store?.name || '' }
    })

    response.cookies.set('__session_admin', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 86400,
    })

    return response
  } catch (e) {
    return handleApiError(e, 'admin-auth-login')
  }
}

export const POST = withDualRateLimit(handler, {
  limit: 5,
  window: '30s',
  emailOf: async (req) => (await req.clone().json().catch(() => null))?.email,
  failClosed: true,
})
