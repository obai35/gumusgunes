import { storeDb } from './store-scoped'
import { createJournalEntry, ACCOUNTS } from './accounting'

export const DEFAULT_OVERHEAD_RATE = 0.2

export interface BomCostResult {
  totalMaterialCost: number
  totalLaborCost: number
  totalOverheadCost: number
  totalCost: number
  unitCost: number
  items: { productId: string; name: string; quantity: number; unitCost: number; total: number }[]
}

export async function calculateBomCost(bomId: string, storeId: string): Promise<BomCostResult> {
  const sdb = storeDb(storeId)
  const bom = await sdb.billOfMaterial.findFirst({
    where: { id: bomId },
    include: {
      items: { include: { product: true } },
      product: true,
    },
  })
  if (!bom) throw new Error('BOM not found')

  let totalMaterialCost = 0
  const items: BomCostResult['items'] = []

  for (const item of bom.items) {
    const unitCost = item.unitCost ?? item.product.costPrice ?? 0
    const total = unitCost * item.quantity * (1 + item.scrapPct / 100)
    totalMaterialCost += total
    items.push({
      productId: item.productId,
      name: item.product.name,
      quantity: item.quantity,
      unitCost,
      total,
    })
  }

  const totalCost = totalMaterialCost
  const unitCost = bom.quantity > 0 ? totalCost / bom.quantity : 0

  return {
    totalMaterialCost,
    totalLaborCost: 0,
    totalOverheadCost: 0,
    totalCost,
    unitCost,
    items,
  }
}

export async function startProductionOrder(orderId: string, storeId: string) {
  const sdb = storeDb(storeId)
  const order = await sdb.productionOrder.findFirst({
    where: { id: orderId },
    include: { bom: { include: { items: true } }, product: true },
  })
  if (!order) throw new Error('Production order not found')
  if (order.status !== 'draft') throw new Error('Only draft orders can be started')

  const updated = await sdb.productionOrder.update({
    where: { id: orderId },
    data: { status: 'in_progress', actualStart: new Date() },
  })

  return updated
}

export async function completeProductionOrder(orderId: string, storeId: string) {
  const sdb = storeDb(storeId)
  const order = await sdb.productionOrder.findFirst({
    where: { id: orderId },
    include: {
      outputs: true,
      materials: true,
      laborEntries: true,
      product: true,
    },
  })
  if (!order) throw new Error('Production order not found')
  if (order.status !== 'in_progress') throw new Error('Only in-progress orders can be completed')

  const totalMaterial = order.materials.reduce((s, m) => s + m.totalCost, 0)
  const totalLabor = order.laborEntries.reduce((s, l) => s + l.totalCost, 0)
  const totalOverhead = totalLabor * DEFAULT_OVERHEAD_RATE
  const totalCost = totalMaterial + totalLabor + totalOverhead
  const goodQty = order.outputs.filter(o => !o.isScrap).reduce((s, o) => s + o.quantity, 0)
  const unitCost = goodQty > 0 ? totalCost / goodQty : 0

  const updated = await sdb.productionOrder.update({
    where: { id: orderId },
    data: {
      status: 'completed',
      actualEnd: new Date(),
      completedQty: goodQty,
      actualMaterialCost: totalMaterial,
      actualLaborCost: totalLabor,
      actualOverheadCost: totalOverhead,
    },
  })

  await createJournalEntry({
    storeId,
    date: new Date(),
    description: `Production complete: ${order.product.name} (${order.orderNumber})`,
    type: 'production',
    lines: [
      { accountCode: ACCOUNTS.finishedGoods, debit: totalCost, credit: 0 },
      { accountCode: ACCOUNTS.wip, debit: 0, credit: totalCost },
    ],
  })

  return updated
}

export async function cancelProductionOrder(orderId: string, storeId: string) {
  const sdb = storeDb(storeId)
  const order = await sdb.productionOrder.findFirst({ where: { id: orderId } })
  if (!order) throw new Error('Production order not found')
  if (order.status === 'completed') throw new Error('Cannot cancel a completed order')

  return sdb.productionOrder.update({
    where: { id: orderId },
    data: { status: 'cancelled' },
  })
}
