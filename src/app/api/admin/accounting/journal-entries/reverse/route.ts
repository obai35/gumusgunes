import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin, AdminInfo } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req: NextRequest, ctx: { params: unknown; admin: AdminInfo }) => {
  const sdb = storeDb(ctx.admin.storeId)
  try {
    const { entryId, reason } = (await req.json()) as { entryId?: string; reason?: string }
    if (!entryId) {
      return NextResponse.json({ error: 'entryId required' }, { status: 400 })
    }

    const entry = await sdb.journalEntry.findFirst({
      where: { id: entryId },
      include: { lines: true },
    })
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (entry.reversesId) {
      return NextResponse.json({ error: 'Entry is already a reversal' }, { status: 400 })
    }

    const reversal = await sdb.journalEntry.create({
      data: {
        date: new Date(),
        description: `Reversal: ${entry.description}${reason ? ` (${reason})` : ''}`,
        reference: entry.reference,
        type: entry.type,
        status: 'approved',
        reversesId: entry.id,
        lines: {
          create: entry.lines.map((l) => ({
            accountId: l.accountId,
            debit: l.credit,
            credit: l.debit,
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    })

    return NextResponse.json({ ok: true, reversal })
  } catch (e) {
    console.error('Reversal error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'accounting')
