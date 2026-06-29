'use client'

import type { PaymentMethod } from '../types'

type Props = {
  total: number
  paymentMethod: PaymentMethod
  disabled: boolean
  loading: boolean
  onClick: () => void
}

export default function CheckoutButton({ total, paymentMethod, disabled, loading, onClick }: Props) {
  const label = loading
    ? 'Processing...'
    : paymentMethod === 'cash'
      ? `Cash $${total.toFixed(2)}`
      : paymentMethod === 'card'
        ? `Card $${total.toFixed(2)}`
        : `Split $${total.toFixed(2)}`

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full px-6 py-3 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  )
}
