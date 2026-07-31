import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().nullable().optional(),
  image: z.string().optional(),
  isVisible: z.boolean().optional(),
}).strict()

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limitParam = searchParams.get('limit')
  const take = limitParam ? Math.min(parseInt(limitParam), 200) : 50
  const skip = (page - 1) * take

  const where: any = {}
  if (search) where.name = { contains: search, mode: 'insensitive' }

  const [categories, total] = await Promise.all([
    sdb.category.findMany({
      where,
      orderBy: { name: 'asc' },
      take,
      skip,
      include: {
        _count: { select: { products: true } },
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true, icon: true, imageUrl: true } },
      },
    }),
    sdb.category.count({ where }),
  ])

  return NextResponse.json({ ok: true, categories, total, page, totalPages: Math.ceil(total / take) })
}, 'categories')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const body = await req.json()
    const parsed = CreateCategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { name, slug, description, icon, parentId, image, isVisible } = parsed.data
    const imageUrl = image

    const existing = await sdb.category.findUnique({ where: { slug } })
    if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })

    const category = await sdb.category.create({
      data: { name, slug, description, imageUrl, icon, parentId: parentId || null, isVisible } as any,
    })

    return NextResponse.json(category)
  } catch (err) {
    console.error('Create category error:', err)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}, 'categories')
