import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

const handler = withAdmin(async (req, { params, admin }) => {
  const result = await db.conversation.updateMany({
    where: { id: params.id, assignedTo: { not: null } },
    data: { assignedTo: null, status: 'WAITING' },
  })

  if (result.count === 0) {
    const conversation = await db.conversation.findUnique({ where: { id: params.id } })
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Conversation is not assigned' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
})

export const POST = handler
