import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const PUT = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { name, permissions } = await req.json()

  const role = await db.role.findUnique({ where: { id } })
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 })

  const data: any = {}
  if (name !== undefined) data.name = name
  if (permissions !== undefined) data.permissions = JSON.stringify(permissions)

  const updated = await db.role.update({ where: { id }, data })
  return NextResponse.json({ ...updated, permissions: JSON.parse(updated.permissions) })
}, 'security')

export const DELETE = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  await db.admin.updateMany({ where: { roleId: id }, data: { roleId: null } })
  await db.role.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}, 'security')
