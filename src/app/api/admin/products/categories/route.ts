import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const categories = await sdb.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    })
    return NextResponse.json(categories)
  } catch {
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 })
  }
}, 'products')
