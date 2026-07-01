import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    })
    return NextResponse.json(categories)
  } catch {
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 })
  }
}
