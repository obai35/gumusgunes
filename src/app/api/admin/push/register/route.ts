import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

const handler = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { token, platform } = await req.json()
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  await sdb.pushToken.upsert({
    where: { adminId_token: { adminId: admin.id, token } },
    update: { platform: platform || 'android' },
    create: { token, platform: platform || 'android', adminId: admin.id },
  })

  return NextResponse.json({ ok: true })
})

export const POST = handler
