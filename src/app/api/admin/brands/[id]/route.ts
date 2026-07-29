import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { handleApiError } from '@/lib/api-error'
import { storeDb } from '@/lib/store-scoped'

export const PUT = withAdmin(async (req: NextRequest, { params, admin }: { params: Promise<{ id: string }>; admin: any }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { id } = await params
    const { name, nameAr, slug, logo, isVisible } = await req.json()

    const existing = await sdb.brand.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })

    if (slug && slug !== existing.slug) {
      const slugConflict = await sdb.brand.findUnique({ where: { slug } })
      if (slugConflict) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    const brand = await sdb.brand.update({
      where: { id },
      data: { name, nameAr, slug, logo, isVisible },
    })

    return NextResponse.json({ ok: true, brand })
  } catch (err) {
    return handleApiError(err, 'PUT /api/admin/brands/[id]')
  }
}, 'brands')

export const DELETE = withAdmin(async (req: NextRequest, { params, admin }: { params: Promise<{ id: string }>; admin: any }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { id } = await params

    const existing = await sdb.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    })
    if (!existing) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    if (existing._count.products > 0) {
      return NextResponse.json({ error: 'Cannot delete brand with products' }, { status: 400 })
    }

    await sdb.brand.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err, 'DELETE /api/admin/brands/[id]')
  }
}, 'brands')
