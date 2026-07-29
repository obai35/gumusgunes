export type Product = {
  id: string
  name: string
  price: number
  stock: number
  imageUrl: string
  sku: string
}

export type CartItem = {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl: string
  stock: number
  discount?: number
}

export type PaymentMethod = 'cash' | 'card' | 'split' | 'bank_transfer' | 'instapay' | 'wallet'

export type AppliedDiscount = {
  code: string
  amount: number
  type: string
  value: number
  appliesTo?: string
  targetValue?: string
}

export type OrderItemDetail = {
  id: string
  quantity: number
  price: number
  product: { name: string; sku: string }
}

export type ReceiptData = {
  orderId: string
  receiptNumber: string
  total: number
  items: OrderItemDetail[]
  subtotal: number
  discount: number
  paymentMethod: string
  cashAmount: number | null
  cardAmount: number | null
  taxRate?: number
  taxAmount?: number
}

export type Shift = {
  id: string
  startingCash: number
  isOpen: boolean
  startedAt: string
}

export type Category = {
  id: string
  name: string
  slug: string
  _count: { products: number }
}

export type HeldOrder = {
  id: string
  label: string
  items: CartItem[]
  heldAt: string
}

export type ShiftSummary = {
  startingCash: number
  endingCash: number
  totalSales: number
  orderCount: number
}
