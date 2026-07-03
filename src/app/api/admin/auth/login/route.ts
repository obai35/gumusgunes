import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import { handleApiError } from '@/lib/api-error'
import { verifyPassword, signAdminToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
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
        details: { email, reason: 'invalid credentials' },
      })
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await verifyPassword(password, admin.password)
    if (!valid) {
      await logAudit({
        adminId: admin.id,
        action: 'admin_login_failed',
        resource: 'auth',
        details: { email, reason: 'invalid password' },
      })
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (admin.totpEnabled) {
      if (!totpToken) return NextResponse.json({ totpRequired: true, adminId: admin.id }, { status: 200 })
      const { verifyTotpCode } = await import('@/lib/totp')
      if (!verifyTotpCode(totpToken, admin.totpSecret!)) {
        await logAudit({
          adminId: admin.id,
          action: 'admin_login_failed',
          resource: 'auth',
          details: { email, reason: 'invalid 2fa code' },
        })
        return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 })
      }
    }

    await logAudit({
      adminId: admin.id,
      action: 'admin_login',
      resource: 'auth',
      resourceId: admin.id,
      details: { email: admin.email },
    })

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
    return handleApiError(e, 'admin-auth-login')
  }
}

export const POST = withRateLimit(handler, { limit: 5, window: '30s' })
