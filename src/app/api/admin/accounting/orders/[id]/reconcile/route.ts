import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const updated = await prisma.order.update({
      where: { id },
      data: { reconciledAt: new Date() },
    })
    return NextResponse.json({ ok: true, order: updated })
  } catch {
    return NextResponse.json({ error: 'Failed to reconcile order' }, { status: 500 })
  }
}
