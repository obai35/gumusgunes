import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const search = req.nextUrl.searchParams.get('search') || ''
  const suppliers = await sdb.supplier.findMany({
    where: search ? { name: { contains: search } } : {},
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(suppliers)
}, 'pos')

export const POST = withAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { name, phone, email, address, notes } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const supplier = await sdb.supplier.create({ data: { name, phone, email, address, notes } as any })
    return NextResponse.json(supplier)
  } catch {
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}, 'pos')
