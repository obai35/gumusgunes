import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search') || ''
  const suppliers = await db.supplier.findMany({
    where: search ? { name: { contains: search } } : {},
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(suppliers)
}

export async function POST(req: Request) {
  try {
    const { name, phone, email, address, notes } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const supplier = await db.supplier.create({ data: { name, phone, email, address, notes } })
    return NextResponse.json(supplier)
  } catch {
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}
