import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const POST = withAdmin(async (req: NextRequest, { params, admin }: { params: Promise<{ id: string }>, admin: any }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  const { status, notes } = await req.json()

  if (!['approved', 'rejected', 'refunded'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const returnRequest = await sdb.returnRequest.findFirst({ where: { id }, include: { product: true } })
  if (!returnRequest) return NextResponse.json({ error: 'Return request not found' }, { status: 404 })

  await sdb.$transaction(async tx => {
    await tx.returnRequest.update({ where: { id }, data: { status, notes: notes || undefined } })

    if (status === 'approved') {
      await tx.product.update({
        where: { id: returnRequest.productId },
        data: { stock: { increment: returnRequest.quantity } },
      })
      await tx.inventoryLog.create({
        data: {
          productId: returnRequest.productId,
          type: 'RETURN',
          change: returnRequest.quantity,
          note: `RMA ${returnRequest.rmaNumber} approved - restocked ${returnRequest.quantity} units`,
        },
      })
    }
  })

  return NextResponse.json({ ok: true })
}, 'orders')
