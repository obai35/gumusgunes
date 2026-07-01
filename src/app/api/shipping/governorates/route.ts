import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const governorates = await db.governorate.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ governorates })
}
