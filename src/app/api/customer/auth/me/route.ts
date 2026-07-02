import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/customer-auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const cookieToken = req.cookies.get('__session')?.value
  const authHeader = req.headers.get('Authorization')
  const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const user = await db.user.findUnique({ where: { id: payload.userId } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
}
