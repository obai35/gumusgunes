import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const payload = verifyAdminToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const admin = await db.admin.findUnique({ where: { id: payload.adminId } })
  if (!admin) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
  }

  const { password: _, ...safeAdmin } = admin

  return NextResponse.json({ admin: safeAdmin })
}
