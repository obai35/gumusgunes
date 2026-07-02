import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req: Request) => {
  try {
    const { branchId, startingCash } = await req.json()
    if (!branchId || startingCash === undefined) {
      return NextResponse.json({ error: 'branchId and startingCash are required' }, { status: 400 })
    }

    const existing = await db.shift.findFirst({ where: { branchId, isOpen: true } })
    if (existing) {
      return NextResponse.json({ error: 'An open shift already exists for this branch' }, { status: 400 })
    }

    const shift = await db.shift.create({
      data: { branchId, startingCash, isOpen: true },
    })

    return NextResponse.json({ ok: true, shift })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to start shift' }, { status: 500 })
  }
}, 'pos')
