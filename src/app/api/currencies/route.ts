import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const currencies = await db.currency.findMany({
      where: { isActive: true },
      select: { code: true, name: true, symbol: true, exchangeRate: true, isDefault: true },
    })
    return NextResponse.json({ ok: true, currencies })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}
