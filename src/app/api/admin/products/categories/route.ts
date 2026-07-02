import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async () => {
  try {
    const categories = await db.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    })
    return NextResponse.json(categories)
  } catch {
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 })
  }
}, 'products')
