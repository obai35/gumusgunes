'use client'

import { memo } from 'react'
import { DollarSign, CreditCard, SplitSquareVertical, Calculator } from 'lucide-react'
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

const QUICK_AMOUNTS = [5, 10, 20, 50, 100]

function PaymentSection({
  paymentMethod, onPaymentMethodChange,
  cashAmount, onCashChange,
  cardAmount, onCardChange,
  total, change,
}: Props) {
  const parsedCash = parseFloat(cashAmount) || 0
  const parsedCard = parseFloat(cardAmount) || 0
  const remaining = paymentMethod === 'split' ? Math.max(0, total - parsedCash - parsedCard) : 0
  const dueMessage = paymentMethod === 'cash' && parsedCash > 0 && parsedCash < total
    ? `Still due: $${(total - parsedCash).toFixed(2)}`
    : null

  return (
    <div>
      <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Payment Method</p>
      <div className="flex gap-2 mb-3">
        {([
          { id: 'cash' as PaymentMethod, label: 'Cash', icon: DollarSign },
          { id: 'card' as PaymentMethod, label: 'Card', icon: CreditCard },
          { id: 'split' as PaymentMethod, label: 'Split', icon: SplitSquareVertical },
        ]).map((m) => (
          <button
            key={m.id}
            onClick={() => onPaymentMethodChange(m.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all flex-1 justify-center ${
              paymentMethod === m.id
                ? 'border-gold bg-gold/15 text-gold shadow-[inset_0_0_0_1px_rgba(212,175,55,0.3)]'
                : 'border-white/10 text-white/40 hover:border-gold/30 hover:text-gold/70 bg-white/5'
            }`}
          >
            <m.icon className="h-3.5 w-3.5" />
            {m.label}
          </button>
        ))}
      </div>

      {paymentMethod === 'cash' && (
        <div className="space-y-2 mb-3">
          <div>
            <label className="text-xs text-white/40 font-medium">Amount Tendered *</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cashAmount}
                onChange={(e) => onCashChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => onCashChange(amt.toFixed(2))}
                className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-white/40 hover:bg-white/10 hover:text-white/60 transition-all font-medium"
              >
                ${amt}
              </button>
            ))}
            <button
              onClick={() => onCashChange(total.toFixed(2))}
              className="px-2.5 py-1 rounded-md bg-gold/10 border border-gold/20 text-[11px] text-gold hover:bg-gold/20 transition-all font-medium"
            >
              <Calculator className="h-3 w-3 inline mr-0.5" />Exact
            </button>
          </div>

          {dueMessage && (
            <div className="flex justify-between text-sm bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
              <span className="text-amber-400 font-medium">{dueMessage}</span>
            </div>
          )}

          {parsedCash >= total && (
            <div className="flex justify-between text-sm bg-emerald-500/10 px-3 py-2.5 rounded-lg border border-emerald-500/20">
              <span className="text-emerald-400 font-medium">Change Due</span>
              <span className="text-emerald-400 font-bold text-lg">${change.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {paymentMethod === 'split' && (
        <div className="space-y-2 mb-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-white/40 font-medium">Cash</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cashAmount}
                  onChange={(e) => onCashChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-white/40 font-medium">Card</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cardAmount}
                  onChange={(e) => onCardChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-1.5">
            <button onClick={() => { onCashChange(total.toFixed(2)); onCardChange('0') }} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[11px] text-white/40 hover:bg-white/10 transition-all">All Cash</button>
            <button onClick={() => { onCashChange('0'); onCardChange(total.toFixed(2)) }} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[11px] text-white/40 hover:bg-white/10 transition-all">All Card</button>
            <button onClick={() => { const half = (total / 2).toFixed(2); onCashChange(half); onCardChange(half) }} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[11px] text-white/40 hover:bg-white/10 transition-all">50/50</button>
          </div>

          {remaining > 0.01 && (
            <div className="text-xs text-amber-400/70 text-center">
              Remaining: ${remaining.toFixed(2)}
            </div>
          )}

          {parsedCash + parsedCard >= total && (
            <div className="flex justify-between text-sm bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
              <div className="flex gap-4 text-xs">
                <span className="text-emerald-400">Cash: ${parsedCash.toFixed(2)}</span>
                <span className="text-emerald-400">Card: ${parsedCard.toFixed(2)}</span>
              </div>
              <span className="text-emerald-400 font-bold text-lg">=${total.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {paymentMethod === 'card' && (
        <div className="mb-3 bg-blue-500/5 px-3 py-2.5 rounded-lg border border-blue-500/20 text-center">
          <span className="text-blue-400 text-sm font-medium">Card payment of ${total.toFixed(2)}</span>
        </div>
      )}
    </div>
  )
}

export default memo(PaymentSection)
