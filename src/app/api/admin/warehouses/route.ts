import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const warehouses = await sdb.warehouse.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { stockLevels: true } } },
  })
  return NextResponse.json({ ok: true, warehouses: warehouses.map(w => ({ id: w.id, name: w.name, code: w.code, address: w.address, isActive: w.isActive, _count: w._count })) })
}, 'inventory')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { name, code, address } = await req.json()
  if (!name || !code) return NextResponse.json({ error: 'Name and code required' }, { status: 400 })
  const existing = await sdb.warehouse.findUnique({ where: { code } })
  if (existing) return NextResponse.json({ error: 'Warehouse code already exists' }, { status: 409 })
  const warehouse = await sdb.warehouse.create({ data: { name, code, address } })
  return NextResponse.json({ ok: true, warehouse })
}, 'inventory')

export const PUT = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { id, name, code, address, isActive } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const warehouse = await sdb.warehouse.update({ where: { id }, data: { name, code, address, isActive } })
  return NextResponse.json({ ok: true, warehouse })
}, 'inventory')

export const DELETE = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await sdb.warehouse.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}, 'inventory')
