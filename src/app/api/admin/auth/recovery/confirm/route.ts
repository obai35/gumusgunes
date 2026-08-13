import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const ConfirmSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
}).strict()

const SUPER_ROLES = ['superadmin', 'super_admin', 'admin']

async function handler(req: Request) {
  try {
    const parsed = ConfirmSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const records = await db.resetToken.findMany({
      where: { email: parsed.data.email, usedAt: null, expiresAt: { gt: new Date() } },
    })

    let resetToken: (typeof records)[number] | null = null
    for (const r of records) {
      if (await bcrypt.compare(parsed.data.token, r.token)) {
        resetToken = r
        break
      }
    }

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    const admin = await db.admin.findUnique({
      where: { email: resetToken.email },
      include: { roleRel: true },
    })
    if (!admin) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    const roleName = admin.roleRel?.name || admin.role
    const isSuper = SUPER_ROLES.includes(roleName)
    const isLastSuperAdmin = isSuper
      ? (await db.admin.count({
          where: {
            storeId: admin.storeId,
            OR: [
              { role: { in: SUPER_ROLES } },
              { roleRel: { name: { in: SUPER_ROLES } } },
            ],
          },
        })) <= 1
      : false

    await db.$transaction([
      db.admin.update({
        where: { id: admin.id },
        data: { totpSecret: null, totpEnabled: false },
      }),
      db.backupCode.deleteMany({ where: { ownerId: admin.id, ownerType: 'admin' } }),
      db.resetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    ])

    if (isLastSuperAdmin) {
      console.error('[admin-recovery] WARNING: 2FA was reset on the last super-admin account', {
        adminId: admin.id,
        email: admin.email,
        storeId: admin.storeId,
      })
      await logAudit({
        adminId: admin.id,
        action: 'admin_2fa_recovery_last_super_admin',
        resource: 'security',
        resourceId: admin.id,
        storeId: admin.storeId,
        details: { warning: 'last super admin recovered without 2FA' },
      })
    } else {
      await logAudit({
        adminId: admin.id,
        action: 'admin_2fa_recovery',
        resource: 'security',
        resourceId: admin.id,
        storeId: admin.storeId,
      })
    }

    return NextResponse.json({ message: '2FA has been disabled. Log in and set it up again.' })
  } catch (error) {
    console.error('[admin-recovery-confirm]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withRateLimit(handler, { limit: 5, window: '120s', failClosed: true })