import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

const handler = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const admins = await sdb.admin.findMany({
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

export const GET = handler
