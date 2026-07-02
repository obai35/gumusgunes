import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async () => {
  const methods = await db.shippingMethod.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ methods })
}, 'shipping')

export const POST = withAdmin(async (req) => {
  const { name, estimatedDays } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const method = await db.shippingMethod.create({ data: { name, estimatedDays: estimatedDays || '' } })
  return NextResponse.json({ method })
}, 'shipping')
