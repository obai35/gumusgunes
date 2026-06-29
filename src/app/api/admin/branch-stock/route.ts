import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const branchId = req.nextUrl.searchParams.get('branchId')
    const all = req.nextUrl.searchParams.get('all')

    if (all === 'true') {
      const stocks = await prisma.branchStock.findMany({
        include: { branch: { select: { name: true } }, product: { select: { name: true, sku: true, stock: true } } },
        orderBy: { branchId: 'asc' },
        take: 200,
      })
      const grouped: Record<string, any> = {}
      for (const s of stocks) {
        if (!grouped[s.branchId]) grouped[s.branchId] = { branchId: s.branchId, branchName: s.branch.name, stocks: [] }
        grouped[s.branchId].stocks.push({ productId: s.productId, productName: s.product.name, sku: s.product.sku, quantity: s.quantity, mainStock: s.product.stock })
      }
      return NextResponse.json({ branches: Object.values(grouped) })
    }

    if (!branchId) return NextResponse.json({ error: 'branchId required' }, { status: 400 })

    const stocks = await prisma.branchStock.findMany({
      where: { branchId },
      include: { product: { select: { name: true, sku: true, price: true, stock: true } } },
      orderBy: { product: { name: 'asc' } },
      take: 200,
    })

    return NextResponse.json(stocks.map((s) => ({
      id: s.id,
      productId: s.productId,
      productName: s.product.name,
      sku: s.product.sku,
      price: s.product.price,
      quantity: s.quantity,
      mainStock: s.product.stock,
    })))
  } catch {
    return NextResponse.json({ error: 'Failed to fetch branch stock' }, { status: 500 })
  }
}
