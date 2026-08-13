import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import { getAdminFromToken, clearAdminCache } from '@/lib/admin-permissions'
import { isPrivilegedAdmin } from '@/lib/admin-2fa'
import { verifyTotpCode } from '@/lib/totp'
import { verifyPassword } from '@/lib/admin-auth'
import { logAudit } from '@/lib/audit'
import { db } from '@/lib/db'
import { z } from 'zod'

const DisableSchema = z.object({
  token: z.string().length(6),
  password: z.string().min(1),
}).strict()

const handler = async (request: NextRequest) => {
  try {
    const parsed = DisableSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const admin = await getAdminFromToken(request)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const record = await db.admin.findUnique({ where: { id: admin.id } })
    if (!record) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    if (!record.totpSecret) {
      return NextResponse.json({ error: '2FA not set up' }, { status: 400 })
    }

    if (isPrivilegedAdmin(admin)) {
      await logAudit({
        adminId: admin.id,
        action: 'admin_2fa_disable_blocked',
        resource: 'security',
        resourceId: admin.id,
        storeId: admin.storeId,
        details: { reason: 'policy: privileged account' },
      })
      return NextResponse.json(
        { error: '2FA is required by policy for this account. Contact a system administrator to recover access.', code: '2FA_POLICY_REQUIRED' },
        { status: 403 }
      )
    }

    if (!verifyTotpCode(parsed.data.token, record.totpSecret)) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    if (!(await verifyPassword(parsed.data.password, record.password))) {
      await logAudit({
        adminId: admin.id,
        action: 'admin_2fa_disable_failed',
        resource: 'security',
        resourceId: admin.id,
        storeId: admin.storeId,
        details: { reason: 'invalid password' },
      })
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await db.$transaction([
      db.admin.update({
        where: { id: admin.id },
        data: { totpSecret: null, totpEnabled: false },
      }),
      db.backupCode.deleteMany({ where: { ownerId: admin.id, ownerType: 'admin' } }),
    ])

    clearAdminCache(admin.id)

    await logAudit({
      adminId: admin.id,
      action: 'admin_2fa_disabled',
      resource: 'security',
      resourceId: admin.id,
      storeId: admin.storeId,
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Disable 2FA error:', e)
    return NextResponse.json({ error: 'Disable failed' }, { status: 500 })
  }
}

export const POST = withRateLimit(handler, { limit: 5, window: '60s', failClosed: true })