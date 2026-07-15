import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const segment = await db.customerSegment.findUnique({ where: { id: params.id } })
  if (!segment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ segment })
}, 'customers')

export const PUT = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { name, rules, isActive } = await req.json()
  const segment = await db.customerSegment.update({
    where: { id: params.id },
    data: { ...(name !== undefined && { name }), ...(rules !== undefined && { rules }), ...(isActive !== undefined && { isActive }) },
  })
  return NextResponse.json({ segment })
}, 'customers')

export const DELETE = withAdmin(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  await db.customerSegment.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}, 'customers')
