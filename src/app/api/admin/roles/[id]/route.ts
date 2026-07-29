import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const PUT = withAdmin(async (req: NextRequest, { params, admin }: { params: Promise<{ id: string }>, admin: any }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  const { name, permissions } = await req.json()

  const role = await sdb.role.findFirst({ where: { id } })
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 })

  const data: any = {}
  if (name !== undefined) data.name = name
  if (permissions !== undefined) data.permissions = JSON.stringify(permissions)

  const updated = await sdb.role.update({ where: { id }, data })
  return NextResponse.json({ ...updated, permissions: JSON.parse(updated.permissions) })
}, 'security')

export const DELETE = withAdmin(async (req: NextRequest, { params, admin }: { params: Promise<{ id: string }>, admin: any }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params

  await sdb.admin.updateMany({ where: { roleId: id }, data: { roleId: null } })
  await sdb.role.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}, 'security')
