import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { code, type, value, maxUses, expiresAt, appliesTo, targetValue, minOrder, governorateId } = await req.json()
    const discount = await db.discount.create({
      data: {
        code: code.toUpperCase().replace(/\s+/g, '_'),
        type,
        value: parseFloat(value),
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        appliesTo: type === 'SHIPPING' ? 'all' : (appliesTo || 'all'),
        targetValue: type === 'SHIPPING' ? null : (targetValue || null),
        minOrder: minOrder ? parseFloat(minOrder) : null,
        governorateId: governorateId || null,
      },
    })
    return NextResponse.json({ discount })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
