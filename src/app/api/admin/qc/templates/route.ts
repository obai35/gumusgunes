import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async () => {
  const templates = await db.qC_Template.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ ok: true, templates: templates.map(t => ({ ...t, items: JSON.parse(t.items) })) })
}, 'products')

export const POST = withAdmin(async (req: NextRequest) => {
  const { name, items, isActive } = await req.json()
  if (!name || !items?.length) return NextResponse.json({ error: 'Name and items required' }, { status: 400 })
  const template = await db.qC_Template.create({
    data: { name, items: JSON.stringify(items), isActive: isActive ?? true },
  })
  return NextResponse.json({ ok: true, template: { ...template, items: JSON.parse(template.items) } })
}, 'products')

export const PUT = withAdmin(async (req: NextRequest) => {
  const { id, name, items, isActive } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const template = await db.qC_Template.update({
    where: { id },
    data: { name, items: JSON.stringify(items), isActive },
  })
  return NextResponse.json({ ok: true, template: { ...template, items: JSON.parse(template.items) } })
}, 'products')

export const DELETE = withAdmin(async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.qC_Template.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}, 'products')
