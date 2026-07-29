import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

const handler = withAdmin(async (req, { admin, params }) => {
  const sdb = storeDb(admin.storeId)
  const result = await sdb.conversation.updateMany({
    where: { id: params.id, assignedTo: null },
    data: { assignedTo: admin.id, status: 'ACTIVE' },
  })

  if (result.count === 0) {
    const conversation = await sdb.conversation.findFirst({ where: { id: params.id } })
    if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ error: 'Already claimed by another admin' }, { status: 409 })
  }

  return NextResponse.json({ ok: true })
})

export const POST = handler
