import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const PUT = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const existing = await db.banner.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    const body = await req.json()
    const { startDate, endDate, ...rest } = body
    const banner = await db.banner.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
    })
    return NextResponse.json(banner)
  } catch (err) {
    console.error('Update banner error:', err)
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 })
  }
}, 'banners')

export const DELETE = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const existing = await db.banner.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    await db.banner.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete banner error:', err)
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 })
  }
}, 'banners')
