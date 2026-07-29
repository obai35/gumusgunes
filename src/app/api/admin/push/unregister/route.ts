import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

const handler = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { token } = await req.json()
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  await sdb.pushToken.deleteMany({ where: { adminId: admin.id, token } })
  return NextResponse.json({ ok: true })
})

export const POST = handler
