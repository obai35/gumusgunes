import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const PUT = withAdmin(async (req: NextRequest, { params, admin }: { params: Promise<{ id: string }>; admin: any }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  try {
    const { name, slug, description, imageUrl, icon, parentId, isVisible } = await req.json()

    const existing = await sdb.category.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

    if (slug && slug !== existing.slug) {
      const slugConflict = await sdb.category.findUnique({ where: { slug } })
      if (slugConflict) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    const category = await sdb.category.update({
      where: { id },
      data: { name, slug, description, imageUrl, icon, parentId: parentId || null, isVisible },
    })

    return NextResponse.json(category)
  } catch (err) {
    console.error('Update category error:', err)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}, 'categories')

export const DELETE = withAdmin(async (req: NextRequest, { params, admin }: { params: Promise<{ id: string }>; admin: any }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  try {
    const existing = await sdb.category.findUnique({ where: { id }, include: { _count: { select: { products: true, children: true } } } })
    if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    if (existing._count.products > 0) return NextResponse.json({ error: 'Cannot delete category with products' }, { status: 400 })
    if (existing._count.children > 0) return NextResponse.json({ error: 'Cannot delete category with subcategories' }, { status: 400 })

    await sdb.category.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete category error:', err)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}, 'categories')
