import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin, AdminInfo } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req: NextRequest, ctx: { params: unknown; admin: AdminInfo }) => {
  try {
    const { ids, reject, reason } = (await req.json()) as {
      ids?: string[]
      reject?: boolean
      reason?: string
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids required' }, { status: 400 })
    }

    if (reject && !reason) {
      return NextResponse.json({ error: 'reason required for rejection' }, { status: 400 })
    }

    const result = await db.journalEntry.updateMany({
      where: { id: { in: ids } },
      data: {
        status: reject ? 'rejected' : 'approved',
        approvedById: ctx.admin.id,
        approvedAt: new Date(),
        ...(reject ? { rejectedReason: reason } : {}),
      },
    })

    return NextResponse.json({ ok: true, count: result.count })
  } catch (e) {
    console.error('Approval error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'accounting')

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status') || 'draft'
    const entries = await db.journalEntry.findMany({
      where: { status },
      include: {
        lines: { include: { account: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ entries })
  } catch (e) {
    console.error('Approval queue error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'accounting')
