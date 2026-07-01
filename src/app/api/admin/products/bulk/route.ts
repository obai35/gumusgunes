import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { action, productIds, value } = await req.json()
    if (!productIds?.length) return NextResponse.json({ error: 'No products selected' }, { status: 400 })

    let result = { count: 0 }

    switch (action) {
      case 'toggleActive': {
        const isActive = value !== false
        result = await db.product.updateMany({
          where: { id: { in: productIds } },
          data: { isActive },
        })
        break
      }
      case 'setCategory': {
        if (!value) return NextResponse.json({ error: 'Category ID required' }, { status: 400 })
        result = await db.product.updateMany({
          where: { id: { in: productIds } },
          data: { categoryId: value },
        })
        break
      }
      case 'adjustPrice': {
        if (!value?.type || !value?.amount) return NextResponse.json({ error: 'Price adjustment params required' }, { status: 400 })
        const products = await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, price: true } })
        for (const p of products) {
          let newPrice = p.price
          if (value.type === 'percentage') {
            const factor = value.amount / 100
            newPrice = value.direction === 'increase' ? p.price * (1 + factor) : p.price * (1 - factor)
          } else {
            newPrice = value.direction === 'increase' ? p.price + value.amount : p.price - value.amount
          }
          newPrice = Math.max(0, Math.round(newPrice * 100) / 100)
          await db.product.update({ where: { id: p.id }, data: { price: newPrice } })
        }
        result = { count: products.length }
        break
      }
      case 'adjustStock': {
        if (!value?.type || value.amount === undefined) return NextResponse.json({ error: 'Stock adjustment params required' }, { status: 400 })
        const products = await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, stock: true } })
        for (const p of products) {
          let newStock = p.stock
          if (value.type === 'set') newStock = value.amount
          else if (value.type === 'add') newStock = p.stock + value.amount
          else if (value.type === 'subtract') newStock = p.stock - value.amount
          newStock = Math.max(0, newStock)
          await db.product.update({ where: { id: p.id }, data: { stock: newStock } })
        }
        result = { count: products.length }
        break
      }
      case 'setFeatured': {
        result = await db.product.updateMany({
          where: { id: { in: productIds } },
          data: { isFeatured: value === true },
        })
        break
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, ...result })
  } catch {
    return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 })
  }
}
