import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromToken } from '@/lib/admin-permissions'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromToken(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!admin.isSuperAdmin && !admin.permissions.includes('admins')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { name, permissions } = await req.json()

  const role = await db.role.findUnique({ where: { id } })
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 })

  const data: any = {}
  if (name !== undefined) data.name = name
  if (permissions !== undefined) data.permissions = JSON.stringify(permissions)

  const updated = await db.role.update({ where: { id }, data })
  return NextResponse.json({ ...updated, permissions: JSON.parse(updated.permissions) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromToken(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!admin.isSuperAdmin && !admin.permissions.includes('admins')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  await db.admin.updateMany({ where: { roleId: id }, data: { roleId: null } })
  await db.role.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
