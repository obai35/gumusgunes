import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAdminToken } from '@/lib/admin-auth'

async function getAdmin(req: NextRequest) {
  const auth = req.headers.get('Authorization')?.slice(7)
  if (!auth) return null
  return verifyAdminToken(auth)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const { name, slug, description, imageUrl, icon, parentId, isVisible } = await req.json()

    const existing = await db.category.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

    if (slug && slug !== existing.slug) {
      const slugConflict = await db.category.findUnique({ where: { slug } })
      if (slugConflict) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    const category = await db.category.update({
      where: { id },
      data: { name, slug, description, imageUrl, icon, parentId: parentId || null, isVisible },
    })

    return NextResponse.json(category)
  } catch (err) {
    console.error('Update category error:', err)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const existing = await db.category.findUnique({ where: { id }, include: { _count: { select: { products: true, children: true } } } })
    if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    if (existing._count.products > 0) return NextResponse.json({ error: 'Cannot delete category with products' }, { status: 400 })
    if (existing._count.children > 0) return NextResponse.json({ error: 'Cannot delete category with subcategories' }, { status: 400 })

    await db.category.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete category error:', err)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
