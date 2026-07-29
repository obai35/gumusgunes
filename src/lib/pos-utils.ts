import crypto from 'crypto'

export const VALID_PAYMENT_METHODS = ['cash', 'card', 'split', 'bank_transfer', 'instapay', 'wallet'] as const

export type PaymentMethod = typeof VALID_PAYMENT_METHODS[number]

export function generateReceiptNumber(): string {
  const now = new Date()
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const seq = crypto.randomUUID().slice(0, 6).toUpperCase()
  return `R-${datePart}-${seq}`
}

export function generateOrderNumber(): string {
  return `P-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`
}

export function formatEGP(value: number): string {
  return 'E£' + value.toFixed(2)
}
