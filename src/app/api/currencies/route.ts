import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storefrontDb } from '@/lib/storefront-db'

export async function GET(req: NextRequest) {
  try {
    const { db: sdb } = await storefrontDb(req)
    const currencies = await sdb.currency.findMany({
      where: { isActive: true },
      select: { code: true, name: true, symbol: true, exchangeRate: true, isDefault: true },
    })
    return NextResponse.json({ ok: true, currencies })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}
