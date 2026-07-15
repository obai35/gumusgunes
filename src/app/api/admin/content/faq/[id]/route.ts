import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const PUT = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const existing = await db.faqEntry.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'FAQ entry not found' }, { status: 404 })
    const body = await req.json()
    const entry = await db.faqEntry.update({ where: { id }, data: body })
    return NextResponse.json(entry)
  } catch (err) {
    console.error('Update FAQ error:', err)
    return NextResponse.json({ error: 'Failed to update FAQ entry' }, { status: 500 })
  }
}, 'faq')

export const DELETE = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const existing = await db.faqEntry.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'FAQ entry not found' }, { status: 404 })
    await db.faqEntry.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete FAQ error:', err)
    return NextResponse.json({ error: 'Failed to delete FAQ entry' }, { status: 500 })
  }
}, 'faq')
