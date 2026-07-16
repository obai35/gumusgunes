import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const POST = withAdmin(async (req, { params }) => {
  const body = await req.json()
  const { adminId } = body
  if (!adminId) {
    return NextResponse.json({ error: 'adminId is required' }, { status: 400 })
  }

  const target = await db.admin.findUnique({ where: { id: adminId } })
  if (!target) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
  }

  const conversation = await db.conversation.findUnique({ where: { id: params.id } })
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  await db.conversation.update({
    where: { id: params.id },
    data: { assignedTo: adminId, status: 'ACTIVE' },
  })

  return NextResponse.json({ ok: true, assignedTo: adminId })
})
