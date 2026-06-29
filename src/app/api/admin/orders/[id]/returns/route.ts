import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const returns = await prisma.return.findMany({
      where: { orderId: id },
      include: {
        items: { include: { product: { select: { name: true, sku: true } } } },
        processedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(returns)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 })
  }
}
