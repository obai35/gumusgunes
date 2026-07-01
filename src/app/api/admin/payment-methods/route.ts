import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { decrypt } from '@/lib/encryption'

export async function GET() {
  const methods = await db.paymentMethod.findMany({ orderBy: { sortOrder: 'asc' } })
  const result = methods.map(m => {
    let config = {}
    try { config = JSON.parse(decrypt(m.config)) } catch { try { config = JSON.parse(m.config) } catch {} }
    return { ...m, config }
  })
  return NextResponse.json({ methods: result })
}
