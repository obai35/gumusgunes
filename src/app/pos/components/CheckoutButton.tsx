'use client'

import { memo } from 'react'
import type { PaymentMethod } from '../types'
import { formatPrice } from '@/lib/format'
import { useTranslation } from '@/hooks/use-translation'

type Props = {
  total: number
  paymentMethod: PaymentMethod
  disabled: boolean
  loading: boolean
  onClick: () => void
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  split: 'Split',
  bank_transfer: 'Bank Transfer',
  instapay: 'Instapay',
  wallet: 'Wallet',
}

function CheckoutButton({ total, paymentMethod, disabled, loading, onClick }: Props) {
  const { t } = useTranslation()
  const label = loading
    ? t('admin.pos.processing')
    : `${PAYMENT_LABELS[paymentMethod]} ${formatPrice(total)}`

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

export default memo(CheckoutButton)
