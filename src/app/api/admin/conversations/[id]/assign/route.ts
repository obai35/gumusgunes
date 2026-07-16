import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

const handler = withAdmin(async (req, { params, admin }) => {
  const body = await req.json()
  const { adminId } = body
  if (!adminId) {
    return NextResponse.json({ error: 'adminId is required' }, { status: 400 })
  }

  const target = await db.admin.findUnique({ where: { id: adminId } })
  if (!target) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
  }

  const result = await db.conversation.updateMany({
    where: { id: params.id },
    data: { assignedTo: adminId, status: 'ACTIVE' },
  })

  if (result.count === 0) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, assignedTo: adminId })
})

export const POST = handler
