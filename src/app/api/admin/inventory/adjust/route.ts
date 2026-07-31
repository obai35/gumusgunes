import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const POST = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { productId, change, note } = await req.json()
    const product = await sdb.product.findUnique({ where: { id: productId } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const newStock = product.stock + change
    if (newStock < 0) return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })

    await sdb.$transaction([
      sdb.product.update({ where: { id: productId }, data: { stock: newStock } }),
      sdb.inventoryLog.create({ data: { productId, change, type: 'ADJUSTMENT', note: note || 'Manual adjustment' } as any }),
    ])

    return NextResponse.json({ success: true, newStock })
  } catch (err) {
    return NextResponse.json({ error: 'Adjustment failed' }, { status: 500 })
  }
}, 'inventory')
