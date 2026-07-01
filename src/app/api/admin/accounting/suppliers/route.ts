import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const suppliers = await db.supplier.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ suppliers })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
