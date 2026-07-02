import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const POST = withAdmin(async (req) => {
  const data = await req.json()
  const product = await prisma.product.create({
    data: {
      name: data.name, slug: data.slug, description: data.description,
      price: data.price, compareAtPrice: data.compareAtPrice, sku: data.sku,
      categoryId: data.categoryId, imageUrl: data.imageUrl, images: data.images || '[]',
      material: data.material, weight: data.weight, stock: data.stock, tags: data.tags || '[]',
      isActive: data.isActive ?? true, isFeatured: data.isFeatured ?? false,
      isNew: data.isNew ?? false, isBestseller: data.isBestseller ?? false,
    },
  })
  return NextResponse.json(product)
}, 'products')
