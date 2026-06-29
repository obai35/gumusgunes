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
      className="w-full px-6 py-3 bg-gradient-to-r from-gold/90 to-gold text-navy-deep rounded-lg text-sm font-bold hover:from-gold hover:to-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-gold/20 active:scale-[0.98]"
    >
      {label}
    </button>
  )
}
