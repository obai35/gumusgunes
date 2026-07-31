import { NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withPosOrAdmin } from '@/lib/pos-or-admin'

export const POST = withPosOrAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { branchId, startingCash } = await req.json()
    if (!branchId || startingCash === undefined) {
      return NextResponse.json({ error: 'branchId and startingCash are required' }, { status: 400 })
    }
    const validatedStartingCash = Number(startingCash)
    if (!Number.isFinite(validatedStartingCash) || validatedStartingCash < 0) {
      return NextResponse.json({ error: 'startingCash must be a non-negative number' }, { status: 400 })
    }
    if (admin.branchId && branchId !== admin.branchId) {
      return NextResponse.json({ error: 'Branch does not belong to this cashier' }, { status: 403 })
    }

    const shift = await sdb.$transaction(async (tx) => {
      const existing = await tx.shift.findFirst({ where: { branchId, isOpen: true } })
      if (existing) {
        return { error: 'An open shift already exists for this branch' }
      }
      const created = await tx.shift.create({
        data: { branchId, startingCash: validatedStartingCash, isOpen: true } as any,
      })
      return created
    })

    if ('error' in shift) {
      return NextResponse.json({ error: shift.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true, shift })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to start shift' }, { status: 500 })
  }
}, 'pos')
