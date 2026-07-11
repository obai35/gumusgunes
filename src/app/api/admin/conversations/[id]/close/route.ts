import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

const handler = withAdmin(async (req, { admin, params }) => {
  await db.conversation.update({
    where: { id: params.id },
    data: { status: 'CLOSED' },
  })
  return NextResponse.json({ ok: true })
})

export const POST = handler
