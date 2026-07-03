import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
  image: z.string().url().optional(),
}).strict()

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
    const body = await req.json()
    const parsed = CreateCategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { name, slug, description, parentId, image } = parsed.data
    const imageUrl = image

    const existing = await db.category.findUnique({ where: { slug } })
    if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })

    const category = await db.category.create({
      data: { name, slug, description, imageUrl, parentId: parentId || null },
    })

    return NextResponse.json(category)
  } catch (err) {
    console.error('Create category error:', err)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}, 'categories')
