import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from './admin-auth'
import { db } from './db'

export const ALL_PERMISSIONS = [
  'dashboard', 'accounting', 'orders', 'receipts', 'products', 'inventory',
  'discounts', 'stock_transfers', 'branches', 'pos', 'editor', 'categories',
  'settings', 'security', 'admins', 'customers', 'payments', 'shipping',
  'reviews', 'newsletter', 'activity', 'chat', 'seed', 'customer_service', 'social',
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

const adminCache = new Map<string, { admin: AdminInfo; expiresAt: number }>()
const CACHE_TTL = 60_000

export function clearAdminCache(adminId?: string) {
  if (adminId) adminCache.delete(adminId)
  else adminCache.clear()
}

export async function getAdminFromToken(req: NextRequest): Promise<AdminInfo | null> {
  const cookieToken = req.cookies.get('__session_admin')?.value
  const authHeader = req.headers.get('Authorization')
  const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)
  if (!token) return null
  const payload = verifyAdminToken(token)
  if (!payload) return null
  const cached = adminCache.get(payload.sub)
  if (cached && cached.expiresAt > Date.now()) return cached.admin
  const admin = await db.admin.findUnique({
    where: { id: payload.sub },
    include: { roleRel: true },
  })
  if (!admin) return null

  if (admin.tokenVersion !== undefined && payload.tokenVersion !== undefined && payload.tokenVersion < admin.tokenVersion) {
    return null
  }

  const role = admin.roleRel?.name || admin.role
  const permissions = admin.roleRel ? JSON.parse(admin.roleRel.permissions) as string[] : []
  const isSuperAdmin = role === 'superadmin' || role === 'super_admin' || role === 'admin'
  const result: AdminInfo = { id: admin.id, email: admin.email, name: admin.name, role, permissions, isSuperAdmin }
  adminCache.set(payload.sub, { admin: result, expiresAt: Date.now() + CACHE_TTL })
  return result
}

export function withAdmin(
  handler: (req: NextRequest, ctx: { params: any; admin: AdminInfo }) => Promise<NextResponse>,
  requiredPermission?: Permission
): (req: NextRequest, ctx: { params: any }) => Promise<NextResponse> {
  return async (req, ctx) => {
    try {
      const admin = await getAdminFromToken(req)
      if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (requiredPermission && !admin.isSuperAdmin && !admin.permissions.includes(requiredPermission)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const params = ctx.params ? await ctx.params : ctx.params
      return await handler(req, { params, admin })
    } catch (err) {
      console.error('[withAdmin] Unhandled error:', err)
      const message = err instanceof Error ? err.message : 'Internal server error'
      return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 })
    }
  }
}

export function requireAdmin(permission?: Permission) {
  return async (req: NextRequest): Promise<Response | null> => {
    const admin = await getAdminFromToken(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (permission && !admin.isSuperAdmin && !admin.permissions.includes(permission)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return null
  }
}
