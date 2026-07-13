import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

const handler = withAdmin(async (req, { admin, params }) => {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = parseInt(searchParams.get('offset') || '0')

  const conversation = await db.conversation.findUnique({
    where: { id: params.id },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      },
      assignedAdmin: { select: { id: true, name: true } },
    },
  })
  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const totalMessages = await db.message.count({ where: { conversationId: params.id } })

  return NextResponse.json({
    ok: true,
    conversation: {
      ...conversation,
      messages: conversation.messages.reverse(),
      totalMessages,
      hasMore: offset + limit < totalMessages,
    },
  })
})

export const GET = handler
