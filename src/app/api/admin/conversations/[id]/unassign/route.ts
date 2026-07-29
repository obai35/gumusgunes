import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

const handler = withAdmin(async (req, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const result = await sdb.conversation.updateMany({
    where: { id: params.id, assignedTo: { not: null } },
    data: { assignedTo: null, status: 'WAITING' },
  })

  if (result.count === 0) {
    const conversation = await sdb.conversation.findFirst({ where: { id: params.id } })
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Conversation is not assigned' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
})

export const POST = handler
