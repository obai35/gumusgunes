import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { productId, change, note } = await req.json()
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const newStock = product.stock + change
    if (newStock < 0) return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })

    await prisma.$transaction([
      prisma.product.update({ where: { id: productId }, data: { stock: newStock } }),
      prisma.inventoryLog.create({ data: { productId, change, type: 'ADJUSTMENT', note: note || 'Manual adjustment' } }),
    ])

    return NextResponse.json({ success: true, newStock })
  } catch (err) {
    return NextResponse.json({ error: 'Adjustment failed' }, { status: 500 })
  }
}
