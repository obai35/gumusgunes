import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromRequest } from '@/lib/auth-api'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const addresses = await prisma.address.findMany({
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
    await prisma.address.updateMany({ where: { userId: user.userId }, data: { isDefault: false } })
  }
  const address = await prisma.address.create({
    data: { userId: user.userId, fullName: body.fullName, phone: body.phone, street: body.street, city: body.city, state: body.state, postalCode: body.postalCode, country: body.country || 'EG', isDefault: body.isDefault || false },
  })
  return NextResponse.json(address, { status: 201 })
}
