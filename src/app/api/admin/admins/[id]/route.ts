import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/admin-auth'
import { withAdmin } from '@/lib/admin-permissions'
import type { AdminInfo } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const PUT = withAdmin(async (req: NextRequest, { params, admin }: { params: Promise<{ id: string }>; admin: AdminInfo }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  const { name, email, password, roleId, phone } = await req.json()

  const target = await sdb.admin.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })

  const data: any = {}
  if (name !== undefined) data.name = name
  if (email !== undefined) data.email = email
  if (password) data.password = await hashPassword(password)
  if (roleId !== undefined) data.roleId = roleId
  if (phone !== undefined) data.phone = phone

  const updated = await sdb.admin.update({ where: { id }, data, include: { roleRel: { select: { name: true } } } })
  return NextResponse.json({ id: updated.id, email: updated.email, name: updated.name, phone: updated.phone, role: updated.roleRel?.name || updated.role, roleId: updated.roleId, totpEnabled: updated.totpEnabled, lastLoginAt: updated.lastLoginAt })
}, 'admins')

export const DELETE = withAdmin(async (req: NextRequest, { params, admin }: { params: Promise<{ id: string }>; admin: AdminInfo }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  if (id === admin.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

  await sdb.admin.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}, 'admins')
