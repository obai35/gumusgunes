import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const POST = withAdmin(async (req, { params }) => {
  const conversation = await db.conversation.findUnique({ where: { id: params.id } })
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  await db.conversation.update({
    where: { id: params.id },
    data: { assignedTo: null, status: 'WAITING' },
  })

  return NextResponse.json({ ok: true })
})
