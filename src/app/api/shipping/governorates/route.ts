import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storefrontDb } from '@/lib/storefront-db'

export async function GET(req: NextRequest) {
  const { db: sdb } = await storefrontDb(req)
  const governorates = await sdb.governorate.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ governorates })
}
