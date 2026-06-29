import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/admin-auth'
import { getAdminFromToken } from '@/lib/admin-permissions'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromToken(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!admin.permissions.includes('admins')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { name, email, password, roleId } = await req.json()

  const target = await db.admin.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })

  const data: any = {}
  if (name !== undefined) data.name = name
  if (email !== undefined) data.email = email
  if (password) data.password = await hashPassword(password)
  if (roleId !== undefined) data.roleId = roleId

  const updated = await db.admin.update({ where: { id }, data, include: { roleRel: { select: { name: true } } } })
  return NextResponse.json({ id: updated.id, email: updated.email, name: updated.name, role: updated.roleRel?.name || updated.role, roleId: updated.roleId })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromToken(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!admin.permissions.includes('admins')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  if (id === admin.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

  await db.admin.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
