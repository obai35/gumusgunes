import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminFromToken } from '@/lib/admin-permissions'

export async function GET(req: NextRequest) {
  const admin = await getAdminFromToken(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!admin.permissions.includes('admins')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const roles = await db.role.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(roles.map((r) => ({ ...r, permissions: JSON.parse(r.permissions) })))
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromToken(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!admin.permissions.includes('admins')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, permissions } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const existing = await db.role.findUnique({ where: { name } })
  if (existing) return NextResponse.json({ error: 'Role already exists' }, { status: 400 })

  const role = await db.role.create({ data: { name, permissions: JSON.stringify(permissions || []) } })
  return NextResponse.json({ ...role, permissions: JSON.parse(role.permissions) })
}
