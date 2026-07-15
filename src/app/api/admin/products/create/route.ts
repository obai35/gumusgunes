import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAdmin } from '@/lib/admin-permissions'
import { sanitize } from '@/lib/sanitize'
import { db } from '@/lib/db'

const CreateProductSchema = z.object({
  name: z.string().min(1).max(200).transform(sanitize),
  description: z.string().min(1).transform(sanitize),
  price: z.number().positive('Price must be greater than 0'),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  categoryId: z.string().uuid(),
  images: z.array(z.string().url()).max(10).default([]),
  tags: z.array(z.string()).max(20).optional(),
  featured: z.boolean().optional(),
  requiresShipping: z.boolean().optional(),
  weight: z.number().positive().optional(),
}).strict()

export const POST = withAdmin(async (req) => {
  const data = await req.json()
  const parsed = CreateProductSchema.safeParse(data)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { name, description, price, stock, categoryId, images, tags, featured, requiresShipping, weight } = parsed.data
  const product = await db.product.create({
    data: {
      name, description,
      price, stock, categoryId,
      images: JSON.stringify(images),
      tags: tags ? JSON.stringify(tags) : '[]',
      weight,
      isFeatured: featured ?? false,
      requiresShipping: requiresShipping ?? true,
    },
  })
  return NextResponse.json(product)
}, 'products')
