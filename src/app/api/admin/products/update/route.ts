import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const data = await req.json()
  const product = await prisma.product.update({
    where: { id: data.id },
    data: {
      name: data.name, slug: data.slug, description: data.description,
      price: data.price, compareAtPrice: data.compareAtPrice, sku: data.sku,
      categoryId: data.categoryId, imageUrl: data.imageUrl, images: data.images,
      material: data.material, weight: data.weight, stock: data.stock, tags: data.tags,
      isActive: data.isActive, isFeatured: data.isFeatured,
      isNew: data.isNew, isBestseller: data.isBestseller,
    },
  })
  return NextResponse.json(product)
}
