import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

const handler = withAdmin(async () => {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    totalConversations,
    activeConversations,
    waitingConversations,
    todayMessages,
    byChannel,
    agentWorkload,
  ] = await Promise.all([
    db.conversation.count(),
    db.conversation.count({ where: { status: 'ACTIVE' } }),
    db.conversation.count({ where: { status: 'WAITING' } }),
    db.message.count({ where: { createdAt: { gte: todayStart } } }),
    db.conversation.groupBy({
      by: ['source'],
      _count: true,
    }),
    db.admin.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { assignedConversations: true } },
      },
      where: { assignedConversations: { some: { status: 'ACTIVE' } } },
    }),
  ])

  const total = byChannel.reduce((sum, c) => sum + c._count, 0)

  // totalConversations already has same value, but we use byChannel.reduce
  // here to ensure channel percentages always sum to 100 even if a
  // conversation has an unknown/missing source

  return NextResponse.json({
    totalConversations,
    activeConversations,
    waitingConversations,
    todayMessages,
    byChannel: byChannel.map(c => ({
      channel: c.source,
      count: c._count,
      percentage: total ? Math.round((c._count / total) * 100) : 0,
    })),
    agentWorkload: agentWorkload.map(a => ({
      adminId: a.id,
      name: a.name,
      activeCount: a._count.assignedConversations,
    })),
  })
})

export const GET = handler
