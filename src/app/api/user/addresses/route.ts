import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth-api'
import { db } from '@/lib/db'
import { storefrontDb } from '@/lib/storefront-db'
import { z } from 'zod'

const AddressSchema = z.object({
  fullName: z.string().min(1).max(100),
  phone: z.string().max(20).optional().default(''),
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional().default(''),
  postalCode: z.string().max(20).optional().default(''),
  country: z.string().max(100).optional().default('EG'),
  isDefault: z.boolean().optional().default(false),
}).strict()

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { db: sdb, storeId } = await storefrontDb(req)
  const addresses = await sdb.address.findMany({
    where: { userId: user.userId, storeId },
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
  const { fullName, phone, street, city, state, postalCode, country, isDefault } = parsed.data
  const { db: sdb, storeId } = await storefrontDb(req)
  if (isDefault) {
    await sdb.address.updateMany({ where: { userId: user.userId, storeId }, data: { isDefault: false } })
  }
  const address = await sdb.address.create({
    data: { userId: user.userId, storeId, fullName, phone: phone || null, street, city, state: state || null, postalCode, country, isDefault },
  })
  return NextResponse.json(address, { status: 201 })
}
