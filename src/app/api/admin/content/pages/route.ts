import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

const CreatePageSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  status: z.enum(['draft', 'published']).default('published'),
}).strict()

export const GET = withAdmin(async (_req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const pages = await sdb.staticPage.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(pages)
}, 'pages')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const body = await req.json()
    const parsed = CreatePageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const existing = await sdb.staticPage.findFirst({ where: { slug: parsed.data.slug } })
    if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })

    const page = await sdb.staticPage.create({ data: parsed.data })
    return NextResponse.json(page)
  } catch (err) {
    console.error('Create static page error:', err)
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 })
  }
}, 'pages')
