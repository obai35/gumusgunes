import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async () => {
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
    db.message.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
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
