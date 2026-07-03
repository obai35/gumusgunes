import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth-api'
import { db } from '@/lib/db'
import { z } from 'zod'

const AddressSchema = z.object({
  label: z.string().min(1).max(50),
  fullName: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  governorateId: z.string().uuid(),
  building: z.string().min(1).max(50),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  landmark: z.string().optional(),
}).strict()

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
  const parsed = AddressSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { fullName, phone, street, city } = parsed.data
  const address = await db.address.create({
    data: { userId: user.userId, fullName, phone, street, city },
  })
  return NextResponse.json(address, { status: 201 })
}
