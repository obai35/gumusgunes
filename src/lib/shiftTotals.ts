import type { Order } from '@prisma/client'

export type ShiftOrderTotals = {
  totalSales: number
  totalCash: number
  totalCard: number
  totalBankTransfer: number
  totalInstapay: number
  totalWallet: number
}

export function computeShiftTotals(
  orders: Pick<Order, 'totalAmount' | 'cashAmount' | 'cardAmount' | 'paymentMethod'>[]
): ShiftOrderTotals {
  const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0)
  const totalCash = orders.reduce((sum, o) => sum + (o.cashAmount || (o.paymentMethod === 'cash' ? o.totalAmount : 0)), 0)
  const totalCard = orders.reduce((sum, o) => sum + (o.cardAmount || (o.paymentMethod === 'card' ? o.totalAmount : 0)), 0)
  const totalBankTransfer = orders.filter((o) => o.paymentMethod === 'bank_transfer').reduce((sum, o) => sum + o.totalAmount, 0)
  const totalInstapay = orders.filter((o) => o.paymentMethod === 'instapay').reduce((sum, o) => sum + o.totalAmount, 0)
  const totalWallet = orders.filter((o) => o.paymentMethod === 'wallet').reduce((sum, o) => sum + o.totalAmount, 0)
  return { totalSales, totalCash, totalCard, totalBankTransfer, totalInstapay, totalWallet }
}
