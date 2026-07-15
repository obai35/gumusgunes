import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { POReceiveClient } from './POReceiveClient'

export const dynamic = 'force-dynamic'

export default async function PurchaseOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const po = await db.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: { include: { product: { select: { id: true, name: true, sku: true, imageUrl: true } } } },
    },
  })
  if (!po) notFound()

  return <POReceiveClient purchaseOrder={JSON.parse(JSON.stringify(po))} />
}
