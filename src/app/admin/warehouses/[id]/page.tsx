import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { WarehouseStockClient } from './WarehouseStockClient'

export const dynamic = 'force-dynamic'

export default async function WarehouseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const warehouse = await db.warehouse.findUnique({ where: { id } })
  if (!warehouse) notFound()
  return <WarehouseStockClient warehouse={warehouse} />
}
