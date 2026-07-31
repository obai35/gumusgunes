import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'
import { handleApiError } from '@/lib/api-error'

const CreateBrandSchema = z.object({
  name: z.string().min(1).max(100),
  nameAr: z.string().optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  logo: z.string().optional(),
  isVisible: z.boolean().optional(),
}).strict()

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limitParam = searchParams.get('limit')
    const take = limitParam ? Math.min(parseInt(limitParam), 200) : 50
    const skip = (page - 1) * take

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [brands, total] = await Promise.all([
      sdb.brand.findMany({
        where,
        orderBy: { name: 'asc' },
        take,
        skip,
        include: {
          _count: { select: { products: true } },
        },
      }),
      sdb.brand.count({ where }),
    ])

    return NextResponse.json({ ok: true, brands, total, page, totalPages: Math.ceil(total / take) })
  } catch (err) {
    return handleApiError(err, 'GET /api/admin/brands')
  }
}, 'brands')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const body = await req.json()
    const parsed = CreateBrandSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { name, nameAr, slug, logo, isVisible } = parsed.data

    const existing = await sdb.brand.findUnique({ where: { slug } })
    if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })

    const brand = await sdb.brand.create({
      data: { name, nameAr, slug, logo, isVisible } as any,
    })

    return NextResponse.json({ ok: true, brand })
  } catch (err) {
    return handleApiError(err, 'POST /api/admin/brands')
  }
}, 'brands')
