import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async () => {
  const admins = await db.admin.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      _count: { select: { assignedConversations: { where: { status: 'ACTIVE' } } } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(
    admins.map(a => ({
      id: a.id,
      name: a.name,
      email: a.email,
      activeConversations: a._count.assignedConversations,
    }))
  )
})
