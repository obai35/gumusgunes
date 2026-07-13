import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

const handler = withAdmin(async (req, { admin }) => {
  const { token } = await req.json()
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  await db.pushToken.deleteMany({ where: { adminId: admin.id, token } })
  return NextResponse.json({ ok: true })
})

export const POST = handler
