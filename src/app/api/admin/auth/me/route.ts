import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const cookieToken = request.cookies.get('__session_admin')?.value
  const authHeader = request.headers.get('Authorization')
  const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = verifyAdminToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const admin = await db.admin.findUnique({ where: { id: payload.adminId }, include: { roleRel: true } })
  if (!admin) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
  }

  const { password: _, roleRel, ...safeAdmin } = admin
  const permissions = roleRel ? JSON.parse(roleRel.permissions) : []

  return NextResponse.json({ admin: { ...safeAdmin, role: roleRel?.name || 'admin', permissions } })
}
