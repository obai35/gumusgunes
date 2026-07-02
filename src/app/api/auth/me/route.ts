import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/customer-auth'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = verifyToken(auth.slice(7))
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, phone: true, createdAt: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({ user })
}
