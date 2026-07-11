import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

const handler = withAdmin(async (req, { admin, params }) => {
  const conversation = await db.conversation.findUnique({ where: { id: params.id } })
  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (conversation.assignedTo && conversation.assignedTo !== admin.id) {
    return NextResponse.json({ error: 'Already claimed by another admin' }, { status: 409 })
  }

  await db.conversation.update({
    where: { id: params.id },
    data: { assignedTo: admin.id, status: 'ACTIVE' },
  })

  return NextResponse.json({ ok: true })
})

export const POST = handler
