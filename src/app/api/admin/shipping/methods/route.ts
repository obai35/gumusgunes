import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const methods = await db.shippingMethod.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ methods })
}

export async function POST(req: Request) {
  const { name, estimatedDays } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const method = await db.shippingMethod.create({ data: { name, estimatedDays: estimatedDays || '' } })
  return NextResponse.json({ method })
}
