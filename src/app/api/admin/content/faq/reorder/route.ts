import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

const ReorderSchema = z.object({
  items: z.array(z.object({ id: z.string(), sortOrder: z.number().int() })),
}).strict()

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const body = await req.json()
    const parsed = ReorderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    await sdb.$transaction(
      parsed.data.items.map(item =>
        sdb.faqEntry.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })
      )
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Reorder FAQ error:', err)
    return NextResponse.json({ error: 'Failed to reorder FAQs' }, { status: 500 })
  }
}, 'faq')
