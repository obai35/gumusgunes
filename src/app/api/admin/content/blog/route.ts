import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  featuredImage: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
}).strict()

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const take = 20
  const skip = (page - 1) * take
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''

  const where: any = {}
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (status === 'draft' || status === 'published') {
    where.status = status
  }

  const [posts, total] = await Promise.all([
    sdb.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    sdb.blogPost.count({ where }),
  ])

  return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / take) })
}, 'blog')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const body = await req.json()
    const parsed = CreatePostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { title, slug, content, excerpt, featuredImage, category, status } = parsed.data

    const existing = await sdb.blogPost.findFirst({ where: { slug } })
    if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })

    const post = await sdb.blogPost.create({
      data: {
        title, slug, content, excerpt, featuredImage, category, status,
        publishedAt: status === 'published' ? new Date() : null,
      },
    })

    return NextResponse.json(post)
  } catch (err) {
    console.error('Create blog post error:', err)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}, 'blog')
