import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { sanitize } from '@/lib/sanitize'
import { db } from '@/lib/db'

export const POST = withAdmin(async (req) => {
  const data = await req.json()
  const product = await db.product.update({
    where: { id: data.id },
    data: {
      name: data.name ? sanitize(data.name) : data.name,
      slug: data.slug,
      description: data.description ? sanitize(data.description) : data.description,
      price: data.price, compareAtPrice: data.compareAtPrice, sku: data.sku,
      categoryId: data.categoryId, imageUrl: data.imageUrl, images: data.images,
      material: data.material, weight: data.weight, stock: data.stock, tags: data.tags,
      isActive: data.isActive, isFeatured: data.isFeatured,
      isNew: data.isNew, isBestseller: data.isBestseller,
    },
  })
  return NextResponse.json(product)
}, 'products')
