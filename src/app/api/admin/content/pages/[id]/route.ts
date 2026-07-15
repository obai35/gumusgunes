import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const page = await db.staticPage.findUnique({ where: { id } })
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  return NextResponse.json(page)
}, 'pages')

export const PUT = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const existing = await db.staticPage.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    const body = await req.json()
    if (body.slug && body.slug !== existing.slug) {
      const slugConflict = await db.staticPage.findUnique({ where: { slug: body.slug } })
      if (slugConflict) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }
    const page = await db.staticPage.update({ where: { id }, data: body })
    return NextResponse.json(page)
  } catch (err) {
    console.error('Update static page error:', err)
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
  }
}, 'pages')

export const DELETE = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const existing = await db.staticPage.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    await db.staticPage.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete static page error:', err)
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 })
  }
}, 'pages')
