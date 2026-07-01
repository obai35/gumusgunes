import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, estimatedDays, isActive } = await req.json()
  const method = await db.shippingMethod.update({ where: { id }, data: { name, estimatedDays, isActive } })
  return NextResponse.json({ method })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.shippingMethod.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
