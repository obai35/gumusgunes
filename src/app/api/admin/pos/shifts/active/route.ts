import { NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withPosOrAdmin } from '@/lib/pos-or-admin'

export const GET = withPosOrAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get('branchId')
    if (!branchId) return NextResponse.json({ error: 'branchId is required' }, { status: 400 })

    const shift = await sdb.shift.findFirst({ where: { branchId, isOpen: true } })
    return NextResponse.json({ ok: true, shift: shift || null })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch active shift' }, { status: 500 })
  }
}, 'pos')
