import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin, AdminInfo } from '@/lib/admin-permissions'
import { recordPurchaseCOGS } from '@/lib/cogs'
import { logAudit } from '@/lib/audit'

export const POST = withAdmin(async (req: Request, { admin }: { params: any; admin: AdminInfo }) => {
  try {
    const { purchaseOrderId } = await req.json()
    if (!purchaseOrderId) {
      return NextResponse.json({ error: 'purchaseOrderId required' }, { status: 400 })
    }

    const po = await db.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: true },
    })

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    if (po.status === 'received') {
      return NextResponse.json({ ok: true, alreadyReceived: true })
    }

    await recordPurchaseCOGS(purchaseOrderId)

    await db.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { status: 'received' },
    })

    try {
      await logAudit({
        adminId: admin.id,
        action: 'receive',
        resource: 'purchase_order',
        resourceId: purchaseOrderId,
        details: { itemCount: po.items.length },
      })
    } catch {}

    return NextResponse.json({ ok: true, itemCount: po.items.length })
  } catch (e) {
    console.error('Purchase receive error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'accounting')
