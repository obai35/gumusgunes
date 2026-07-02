import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { withAdmin } from '@/lib/admin-permissions'

const prisma = new PrismaClient()

export const GET = withAdmin(async (req, { params }: { params: Promise<{ id: string }> }) => {
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
}, 'orders')
