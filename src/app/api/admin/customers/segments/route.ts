import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (_req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const segments = await sdb.customerSegment.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ segments })
}, 'customers')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { name, rules, isActive } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const segment = await sdb.customerSegment.create({
    data: { name, rules: rules || {}, isActive: isActive ?? true } as any,
  })
  return NextResponse.json({ segment })
}, 'customers')
