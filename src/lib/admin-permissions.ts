import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from './admin-auth'
import { db } from './db'

export const ALL_PERMISSIONS = [
  'dashboard', 'accounting', 'orders', 'receipts', 'products', 'inventory',
  'discounts', 'stock_transfers', 'branches', 'pos', 'editor', 'categories', 'settings', 'security', 'admins',
] as const

export type Permission = typeof ALL_PERMISSIONS[number]

export type AdminInfo = {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
  isSuperAdmin: boolean
}

export async function getAdminFromToken(req: NextRequest): Promise<AdminInfo | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const payload = verifyAdminToken(authHeader.slice(7))
  if (!payload) return null
  const admin = await db.admin.findUnique({
    where: { id: payload.adminId },
    include: { roleRel: true },
  })
  if (!admin) return null
  const role = admin.roleRel?.name || admin.role
  const permissions = admin.roleRel ? JSON.parse(admin.roleRel.permissions) as string[] : []
  const isSuperAdmin = role === 'superadmin' || role === 'admin'
  return { id: admin.id, email: admin.email, name: admin.name, role, permissions, isSuperAdmin }
}

export function requirePermission(permission: Permission) {
  return async (req: NextRequest): Promise<Response | null> => {
    const admin = await getAdminFromToken(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!admin.isSuperAdmin && !admin.permissions.includes(permission)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return null
  }
}
