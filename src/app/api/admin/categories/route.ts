import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const categories = await db.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { products: true } },
      parent: { select: { id: true, name: true, slug: true } },
      children: { select: { id: true, name: true, slug: true, icon: true, imageUrl: true } },
    },
  })

  return NextResponse.json(categories)
}, 'categories')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { name, slug, description, imageUrl, icon, parentId, isVisible } = await req.json()
    if (!name || !slug) return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })

    const existing = await db.category.findUnique({ where: { slug } })
    if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })

    const category = await db.category.create({
      data: { name, slug, description, imageUrl, icon, parentId: parentId || null, isVisible: isVisible ?? true },
    })

    return NextResponse.json(category)
  } catch (err) {
    console.error('Create category error:', err)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}, 'categories')
