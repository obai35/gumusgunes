import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

const CreateBannerSchema = z.object({
  title: z.string().max(200).optional(),
  imageUrl: z.string().min(1),
  linkUrl: z.string().optional(),
  textOverlay: z.string().max(500).optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).strict()

export const GET = withAdmin(async () => {
  const banners = await db.banner.findMany({ orderBy: { sortOrder: 'asc' } })
  return NextResponse.json(banners)
}, 'banners')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = CreateBannerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { startDate, endDate, ...rest } = parsed.data
    const banner = await db.banner.create({
      data: {
        ...rest,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })
    return NextResponse.json(banner)
  } catch (err) {
    console.error('Create banner error:', err)
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
  }
}, 'banners')
