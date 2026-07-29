import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'
import { clearAdminCache } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  await sdb.admin.update({
    where: { id: admin.id },
    data: { tokenVersion: { increment: 1 } },
  })
  clearAdminCache(admin.id)
  return NextResponse.json({ ok: true })
}, 'security')
