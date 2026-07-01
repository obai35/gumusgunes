import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get('branchId')
    if (!branchId) return NextResponse.json({ error: 'branchId is required' }, { status: 400 })

    const shift = await db.shift.findFirst({ where: { branchId, isOpen: true } })
    return NextResponse.json({ ok: true, shift: shift || null })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch active shift' }, { status: 500 })
  }
}
