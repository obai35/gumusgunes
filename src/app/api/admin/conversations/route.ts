import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

const handler = withAdmin(async (req, { admin }) => {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined

  const where: any = {}
  if (status) where.status = status

  const conversations = await db.conversation.findMany({
    where,
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      assignedAdmin: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({
    ok: true,
    conversations: conversations.map(c => ({
      id: c.id,
      customerName: c.customerName,
      customerPhone: c.customerPhone,
      status: c.status,
      source: c.source,
      assignedTo: c.assignedAdmin || null,
      lastMessage: c.messages[0] || null,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))
  })
})

export const GET = handler
