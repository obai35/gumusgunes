import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const roles = await db.role.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(roles.map((r) => ({ ...r, permissions: JSON.parse(r.permissions) })))
}, 'security')

export const POST = withAdmin(async (req: NextRequest) => {
  const { name, permissions } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const existing = await db.role.findUnique({ where: { name } })
  if (existing) return NextResponse.json({ error: 'Role already exists' }, { status: 400 })

  const role = await db.role.create({ data: { name, permissions: JSON.stringify(permissions || []) } })
  return NextResponse.json({ ...role, permissions: JSON.parse(role.permissions) })
}, 'security')
