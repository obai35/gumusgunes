import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withPosOrAdmin } from '@/lib/pos-or-admin'

export const GET = withPosOrAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const search = req.nextUrl.searchParams.get('search') || ''
  const suppliers = await sdb.supplier.findMany({
    where: search ? { name: { contains: search, mode: 'insensitive' } } : {},
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(suppliers)
}, 'pos')

export const POST = withPosOrAdmin(async (req: Request, { admin }) => {
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
