import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

const CreateFaqSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  category: z.string().max(100).default('General'),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
}).strict()

export const GET = withAdmin(async (_req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const entries = await sdb.faqEntry.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json(entries)
}, 'faq')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const body = await req.json()
    const parsed = CreateFaqSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const maxSort = await sdb.faqEntry.aggregate({ _max: { sortOrder: true } })
    const entry = await sdb.faqEntry.create({
      data: { ...parsed.data, sortOrder: parsed.data.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1 },
    })
    return NextResponse.json(entry)
  } catch (err) {
    console.error('Create FAQ error:', err)
    return NextResponse.json({ error: 'Failed to create FAQ entry' }, { status: 500 })
  }
}, 'faq')
