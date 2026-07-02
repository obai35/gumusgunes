import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth-api'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const addresses = await db.address.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(addresses)
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (body.isDefault) {
    await db.address.updateMany({ where: { userId: user.userId }, data: { isDefault: false } })
  }
  const address = await db.address.create({
    data: { userId: user.userId, fullName: body.fullName, phone: body.phone, street: body.street, city: body.city, state: body.state, postalCode: body.postalCode, country: body.country || 'EG', isDefault: body.isDefault || false },
  })
  return NextResponse.json(address, { status: 201 })
}
