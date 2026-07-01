import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { decrypt } from '@/lib/encryption'

export async function GET() {
  const methods = await db.paymentMethod.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
  const result = methods.map(m => ({
    ...m,
    config: m.config ? JSON.parse(decrypt(m.config)) : {},
  }))
  return NextResponse.json({ methods: result })
}
