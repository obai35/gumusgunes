import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/admin-auth'
import { getAdminFromToken } from '@/lib/admin-permissions'

export async function GET(req: NextRequest) {
  const admin = await getAdminFromToken(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!admin.permissions.includes('admins')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admins = await db.admin.findMany({
    include: { roleRel: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(admins.map((a) => ({ id: a.id, email: a.email, name: a.name, role: a.roleRel?.name || a.role, roleId: a.roleId, createdAt: a.createdAt })))
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromToken(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!admin.permissions.includes('admins')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, email, password, roleId } = await req.json()
  if (!name || !email || !password || !roleId) return NextResponse.json({ error: 'Name, email, password, and roleId required' }, { status: 400 })

  const existing = await db.admin.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

  const created = await db.admin.create({
    data: { name, email, password: await hashPassword(password), roleId },
    include: { roleRel: { select: { name: true } } },
  })
  return NextResponse.json({ id: created.id, email: created.email, name: created.name, role: created.roleRel?.name || 'admin', roleId: created.roleId, createdAt: created.createdAt })
}
