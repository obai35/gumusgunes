import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const POST = withAdmin(async (req) => {
  const { productId, field, value } = await req.json()
  const allowed = ['isActive', 'isFeatured', 'isNew', 'isBestseller']
  if (!allowed.includes(field)) return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  await prisma.product.update({ where: { id: productId }, data: { [field]: value } })
  return NextResponse.json({ success: true })
}, 'products')
