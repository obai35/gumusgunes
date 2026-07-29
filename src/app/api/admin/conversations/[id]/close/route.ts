import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

const handler = withAdmin(async (req, { admin, params }) => {
  const sdb = storeDb(admin.storeId)
  await sdb.conversation.update({
    where: { id: params.id },
    data: { status: 'CLOSED' },
  })
  return NextResponse.json({ ok: true })
})

export const POST = handler
