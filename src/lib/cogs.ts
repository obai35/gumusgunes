import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { createJournalEntry } from './accounting'

export async function updateProductCost(productId: string, newCost: number): Promise<void> {
  const product = await db.product.findUnique({ where: { id: productId } })
  if (!product) return

  await db.product.update({
    where: { id: productId },
    data: { costPrice: newCost },
  })
}

export async function recordActualCost(orderItemId: string, productId: string, quantity: number): Promise<void> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { costPrice: true },
  })

  const actualCost = product?.costPrice ? product.costPrice * quantity : 0

  await db.orderItem.update({
    where: { id: orderItemId },
    data: { actualCost },
  })
}

export async function recordCOGS(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) return

  const totalCost = order.items.reduce((sum, item) => sum + (item.actualCost || 0), 0)
  if (totalCost === 0) return

  const existing = await db.journalEntry.findFirst({
    where: { orderId, type: 'cogs' },
  })
  if (existing) return

  await createJournalEntry({
    date: new Date(),
    description: `COGS for #${orderId.slice(0, 8)}`,
    reference: orderId,
    type: 'cogs',
    orderId,
    lines: [
      { accountCode: '5000', debit: totalCost },
      { accountCode: '1300', credit: totalCost },
    ],
  })
}

export async function recordPurchaseCOGS(purchaseOrderId: string): Promise<void> {
  const po = await db.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { items: true },
  })
  if (!po) return

  for (const item of po.items) {
    await db.product.update({
      where: { id: item.productId },
      data: { costPrice: item.unitCost },
    })
  }
}

export async function getInventoryValuation(storeId?: string): Promise<{ items: any[]; totalProducts: number; totalValue: number; totalCOGS: number; grossMargin: number }> {
  const qb = storeId ? storeDb(storeId) as typeof db : db
  const products = await qb.product.findMany({
    where: { isActive: true, stock: { gt: 0 } },
    select: { id: true, name: true, sku: true, costPrice: true, stock: true, price: true },
    orderBy: { name: 'asc' },
  })

  const items = products.map(p => ({
    id: p.id,
    sku: p.sku || p.id.slice(0, 8),
    name: p.name,
    quantity: p.stock,
    unitCost: p.costPrice || 0,
    totalValue: p.stock * (p.costPrice || 0),
  }))

  const totalValue = items.reduce((s, i) => s + i.totalValue, 0)
  const totalSellPrice = products.reduce((s, p) => s + p.stock * p.price, 0)
  const totalCOGS = totalValue
  const grossMargin = totalSellPrice > 0 ? ((totalSellPrice - totalCOGS) / totalSellPrice) * 100 : 0

  return { items, totalProducts: items.length, totalValue, totalCOGS, grossMargin }
}

export async function getCOGSReport(startDate: Date, endDate: Date): Promise<{ entries: any[]; totalCOGS: number }> {
  const entries = await db.journalEntry.findMany({
    where: {
      type: 'cogs',
      date: { gte: startDate, lte: endDate },
    },
    include: {
      lines: {
        include: { account: true },
        where: { account: { code: '5000' } },
      },
    },
    orderBy: { date: 'desc' },
  })

  const totalCOGS = entries.reduce((sum, e) => {
    const debitSum = e.lines.reduce((s, l) => s + l.debit, 0)
    return sum + debitSum
  }, 0)

  return { entries, totalCOGS }
}
