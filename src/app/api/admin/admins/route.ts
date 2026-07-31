import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/admin-auth'
import { withAdmin } from '@/lib/admin-permissions'
import { logAudit } from '@/lib/audit'
import { storeDb } from '@/lib/store-scoped'

const CreateAdminSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Must include a lowercase letter')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a digit'),
  roleId: z.string().min(1),
  phone: z.string().optional(),
}).strict()

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const admins = await sdb.admin.findMany({
    include: { roleRel: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(admins.map((a) => ({ id: a.id, email: a.email, name: a.name, phone: a.phone, role: a.roleRel?.name || a.role, roleId: a.roleId, totpEnabled: a.totpEnabled, lastLoginAt: a.lastLoginAt, createdAt: a.createdAt })))
}, 'admins')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const parsed = CreateAdminSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { name, email, password, roleId, phone } = parsed.data

  const existing = await sdb.admin.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

  const created: any = await sdb.admin.create({
    data: { name, email, password: await hashPassword(password), roleId, phone } as any,
    include: { roleRel: { select: { name: true } } },
  })

  await logAudit({
    adminId: admin.id,
    action: 'admin_created',
    resource: 'admin',
    resourceId: created.id,
    details: { targetEmail: created.email, roleId: created.roleId },
  })

  return NextResponse.json({ id: created.id, email: created.email, name: created.name, phone: created.phone, role: created.roleRel?.name || 'admin', roleId: created.roleId, totpEnabled: created.totpEnabled, lastLoginAt: created.lastLoginAt, createdAt: created.createdAt })
}, 'admins')
