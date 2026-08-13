import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import { getAdminFromToken, clearAdminCache } from '@/lib/admin-permissions'
import { verifyTotpCode } from '@/lib/totp'
import { generateBackupCodes } from '@/lib/backup-codes'
import { logAudit } from '@/lib/audit'
import { db } from '@/lib/db'
import { z } from 'zod'

const RegenerateSchema = z.object({
  token: z.string().length(6),
}).strict()

const handler = async (request: NextRequest) => {
  try {
    const parsed = RegenerateSchema.safeParse(await request.json())
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

    if (!record.totpEnabled || !record.totpSecret) {
      return NextResponse.json({ error: '2FA not set up' }, { status: 400 })
    }

    if (!verifyTotpCode(parsed.data.token, record.totpSecret)) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    const backupCodes = generateBackupCodes()

    await db.$transaction([
      db.backupCode.deleteMany({ where: { ownerId: admin.id, ownerType: 'admin' } }),
      db.backupCode.createMany({
        data: backupCodes.map((c) => ({
          ownerId: admin.id,
          ownerType: 'admin',
          index: c.index,
          hash: c.hash,
        })),
      }),
    ])

    await logAudit({
      adminId: admin.id,
      action: 'admin_2fa_backup_codes_regenerated',
      resource: 'security',
      resourceId: admin.id,
      storeId: admin.storeId,
      details: { backupCodes: backupCodes.length },
    })

    return NextResponse.json({ success: true, backupCodes: backupCodes.map((c) => c.code) })
  } catch (e) {
    console.error('Regenerate backup codes error:', e)
    return NextResponse.json({ error: 'Regeneration failed' }, { status: 500 })
  }
}

export const POST = withRateLimit(handler, { limit: 3, window: '60s', failClosed: true })