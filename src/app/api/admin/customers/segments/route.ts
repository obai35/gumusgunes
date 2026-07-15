import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async () => {
  const segments = await db.customerSegment.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ segments })
}, 'customers')

export const POST = withAdmin(async (req: NextRequest) => {
  const { name, rules, isActive } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const segment = await db.customerSegment.create({
    data: { name, rules: rules || {}, isActive: isActive ?? true },
  })
  return NextResponse.json({ segment })
}, 'customers')
