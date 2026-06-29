'use client'

import { DollarSign, CreditCard, SplitSquareVertical } from 'lucide-react'
import type { PaymentMethod } from '../types'

type Props = {
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (method: PaymentMethod) => void
  cashAmount: string
  onCashChange: (value: string) => void
  cardAmount: string
  onCardChange: (value: string) => void
  total: number
  change: number
}

export default function PaymentSection({
  paymentMethod, onPaymentMethodChange,
  cashAmount, onCashChange,
  cardAmount, onCardChange,
  total, change,
}: Props) {
  const parsedCash = parseFloat(cashAmount) || 0

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Payment Method</p>
      <div className="flex gap-2 mb-3">
        {([
          { id: 'cash' as PaymentMethod, label: 'Cash', icon: DollarSign },
          { id: 'card' as PaymentMethod, label: 'Card', icon: CreditCard },
          { id: 'split' as PaymentMethod, label: 'Split', icon: SplitSquareVertical },
        ]).map((m) => (
          <button
            key={m.id}
            onClick={() => onPaymentMethodChange(m.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border-2 transition-colors flex-1 justify-center ${
              paymentMethod === m.id
                ? 'border-gold bg-gold/5 text-navy'
                : 'border-border text-muted-foreground hover:border-gold/40'
            }`}
          >
            <m.icon className="h-3.5 w-3.5" />
            {m.label}
          </button>
        ))}
      </div>

      {(paymentMethod === 'cash' || paymentMethod === 'split') && (
        <div className="space-y-2 mb-3">
          <div>
            <label className="text-xs text-muted-foreground font-medium">
              {paymentMethod === 'cash' ? 'Amount Tendered' : 'Cash Amount'} *
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cashAmount}
                onChange={(e) => onCashChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
          </div>
          {paymentMethod === 'cash' && parsedCash >= total && (
            <div className="flex justify-between text-sm bg-green-50 px-3 py-2 rounded-lg">
              <span className="text-green-700 font-medium">Change</span>
              <span className="text-green-700 font-bold">${change.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {paymentMethod === 'split' && (
        <div className="mb-3">
          <label className="text-xs text-muted-foreground font-medium">Card Amount *</label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={cardAmount}
              onChange={(e) => onCardChange(e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}
