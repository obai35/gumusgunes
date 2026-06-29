import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fromType, fromId, toType, toId, items, note, createdById } = body

    if (!fromType || !toType) return NextResponse.json({ error: 'fromType and toType required' }, { status: 400 })
    if (!items?.length) return NextResponse.json({ error: 'At least one item required' }, { status: 400 })
    if (!createdById) return NextResponse.json({ error: 'createdById required' }, { status: 400 })
    if (fromType === 'branch' && !fromId) return NextResponse.json({ error: 'fromId required when fromType=branch' }, { status: 400 })
    if (toType === 'branch' && !toId) return NextResponse.json({ error: 'toId required when toType=branch' }, { status: 400 })

    const admin = await prisma.admin.findUnique({ where: { id: createdById } })
    if (!admin) return NextResponse.json({ error: 'Admin not found' }, { status: 400 })

    for (const item of items) {
      if (fromType === 'branch') {
        const bs = await prisma.branchStock.findUnique({ where: { branchId_productId: { branchId: fromId!, productId: item.productId } } })
        if (!bs || bs.quantity < item.quantity) return NextResponse.json({ error: `Insufficient stock for product ${item.productId} at source branch` }, { status: 400 })
      } else {
        const product = await prisma.product.findUnique({ where: { id: item.productId } })
        if (!product || product.stock < item.quantity) return NextResponse.json({ error: `Insufficient warehouse stock for product ${item.productId}` }, { status: 400 })
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const transfers = []

      for (const item of items) {
        if (fromType === 'warehouse') {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } })
        } else {
          await tx.branchStock.update({ where: { branchId_productId: { branchId: fromId!, productId: item.productId } }, data: { quantity: { decrement: item.quantity } } })
        }

        if (toType === 'warehouse') {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } })
        } else {
          await tx.branchStock.upsert({
            where: { branchId_productId: { branchId: toId!, productId: item.productId } },
            create: { branchId: toId!, productId: item.productId, quantity: item.quantity },
            update: { quantity: { increment: item.quantity } },
          })
        }

        const transfer = await tx.stockTransfer.create({
          data: {
            fromType, fromId: fromId || null, toType, toId: toId || null,
            productId: item.productId, quantity: item.quantity,
            note: note || null, createdById,
          },
        })
        transfers.push(transfer)

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            type: 'TRANSFER',
            change: toType === 'warehouse' ? item.quantity : -item.quantity,
            note: `Transfer ${fromType}${fromId ? `(${fromId})` : ''} → ${toType}${toId ? `(${toId})` : ''}${note ? `: ${note}` : ''}`,
          },
        })
      }

      return transfers
    })

    return NextResponse.json({ transfers: result })
  } catch {
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const branchId = req.nextUrl.searchParams.get('branchId')
    const where: any = {}
    if (branchId) {
      where.OR = [{ fromId: branchId, fromType: 'branch' }, { toId: branchId, toType: 'branch' }]
    }

    const transfers = await prisma.stockTransfer.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(transfers.map((t) => ({
      id: t.id,
      fromType: t.fromType, fromId: t.fromId, toType: t.toType, toId: t.toId,
      productName: t.product.name, sku: t.product.sku,
      quantity: t.quantity, note: t.note, adminName: t.createdBy.name, createdAt: t.createdAt,
    })))
  } catch {
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 })
  }
}
