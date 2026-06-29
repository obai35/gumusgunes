import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromRequest } from '@/lib/auth-api'

const prisma = new PrismaClient()

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await prisma.address.findFirst({ where: { id, userId: user.userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  if (body.isDefault) {
    await prisma.address.updateMany({ where: { userId: user.userId }, data: { isDefault: false } })
  }
  const updated = await prisma.address.update({
    where: { id },
    data: { fullName: body.fullName, phone: body.phone, street: body.street, city: body.city, state: body.state, postalCode: body.postalCode, country: body.country, isDefault: body.isDefault },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await prisma.address.findFirst({ where: { id, userId: user.userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.address.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
