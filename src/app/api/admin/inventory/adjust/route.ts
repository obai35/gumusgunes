import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const POST = withAdmin(async (req) => {
  try {
    const { productId, change, note } = await req.json()
    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const newStock = product.stock + change
    if (newStock < 0) return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })

    await db.$transaction([
      db.product.update({ where: { id: productId }, data: { stock: newStock } }),
      db.inventoryLog.create({ data: { productId, change, type: 'ADJUSTMENT', note: note || 'Manual adjustment' } }),
    ])

    return NextResponse.json({ success: true, newStock })
  } catch (err) {
    return NextResponse.json({ error: 'Adjustment failed' }, { status: 500 })
  }
}, 'inventory')
