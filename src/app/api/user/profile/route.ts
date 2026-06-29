import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromRequest } from '@/lib/auth-api'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const profile = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { id: true, email: true, name: true, phone: true },
  })
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(profile)
}

export async function PUT(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const updated = await prisma.user.update({
    where: { id: user.userId },
    data: { name: body.name, phone: body.phone },
    select: { id: true, email: true, name: true, phone: true },
  })
  return NextResponse.json(updated)
}
