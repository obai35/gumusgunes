import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { userId, note } = await req.json()
  if (!userId || !note) return NextResponse.json({ error: 'userId and note are required' }, { status: 400 })
  const customerNote = await sdb.customerNote.create({
    data: { userId, adminId: admin.id, note } as any,
  })
  return NextResponse.json({ note: customerNote })
}, 'customers')
