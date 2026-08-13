import { NextRequest, NextResponse } from 'next/server'
import { AdminInfo, getAdminFromToken, Permission } from './admin-permissions'
import { verifyPosToken } from './pos-auth'
import { db } from './db'

export type PosOrAdminInfo = AdminInfo & { branchId?: string }

export function withPosOrAdmin(
  handler: (req: NextRequest, ctx: { params: any; admin: PosOrAdminInfo }) => Promise<NextResponse>,
  requiredPermission?: Permission
): (req: NextRequest, ctx: { params: any }) => Promise<NextResponse> {
  return async (req, ctx) => {
    try {
      const params = ctx.params ? await ctx.params : ctx.params

      const admin = await getAdminFromToken(req)
      if (admin) {
        if (requiredPermission && !admin.isSuperAdmin && !admin.permissions.includes(requiredPermission)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        return await handler(req, { params, admin })
      }

      const posToken = req.cookies.get('__session_pos')?.value ?? null
      if (posToken) {
        const posUser = verifyPosToken(posToken)
        if (posUser) {
          const branch = await db.branch.findUnique({
            where: { id: posUser.branchId },
            select: { id: true, storeId: true, isActive: true },
          })
          if (branch && branch.isActive) {
            const posAdmin: PosOrAdminInfo = {
              id: posUser.id,
              email: posUser.email,
              name: posUser.name,
              role: 'pos_cashier',
              permissions: ['pos'],
              isSuperAdmin: false,
              storeId: branch.storeId,
              branchId: branch.id,
              totpEnabled: true,
            }
            return await handler(req, { params, admin: posAdmin })
          }
        }
      }

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    } catch (err) {
      console.error('[withPosOrAdmin] Unhandled error:', err)
      const message = err instanceof Error ? err.message : 'Internal server error'
      return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 })
    }
  }
}
