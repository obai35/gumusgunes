import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/admin-auth'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const admins = await db.admin.findMany({
    include: { roleRel: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(admins.map((a) => ({ id: a.id, email: a.email, name: a.name, role: a.roleRel?.name || a.role, roleId: a.roleId, createdAt: a.createdAt })))
}, 'admins')

export const POST = withAdmin(async (req: NextRequest) => {
  const { name, email, password, roleId } = await req.json()
  if (!name || !email || !password || !roleId) return NextResponse.json({ error: 'Name, email, password, and roleId required' }, { status: 400 })

  const existing = await db.admin.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

  const created = await db.admin.create({
    data: { name, email, password: await hashPassword(password), roleId },
    include: { roleRel: { select: { name: true } } },
  })
  return NextResponse.json({ id: created.id, email: created.email, name: created.name, role: created.roleRel?.name || 'admin', roleId: created.roleId, createdAt: created.createdAt })
}, 'admins')
