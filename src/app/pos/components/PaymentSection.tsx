'use client'

import { memo } from 'react'
import { DollarSign, CreditCard, SplitSquareVertical, Calculator, Building2, Smartphone, Wallet } from 'lucide-react'
import type { PaymentMethod } from '../types'
import { formatPrice } from '@/lib/format'
import { useTranslation } from '@/hooks/use-translation'

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

const PAYMENT_METHODS: { id: PaymentMethod; icon: any; labelKey: string }[] = [
  { id: 'cash', icon: DollarSign, labelKey: 'admin.pos.cash' },
  { id: 'card', icon: CreditCard, labelKey: 'admin.pos.card' },
  { id: 'split', icon: SplitSquareVertical, labelKey: 'admin.pos.split' },
  { id: 'bank_transfer', icon: Building2, labelKey: 'admin.pos.bankTransfer' },
  { id: 'instapay', icon: Smartphone, labelKey: 'admin.pos.instapay' },
  { id: 'wallet', icon: Wallet, labelKey: 'admin.pos.wallet' },
]

function PaymentSection({
  paymentMethod, onPaymentMethodChange,
  cashAmount, onCashChange,
  cardAmount, onCardChange,
  total, change,
}: Props) {
  const { t } = useTranslation()
  const parsedCash = parseFloat(cashAmount) || 0
  const parsedCard = parseFloat(cardAmount) || 0
  const remaining = paymentMethod === 'split' ? Math.max(0, total - parsedCash - parsedCard) : 0
  const stillDue = paymentMethod === 'cash' && parsedCash > 0 && parsedCash < total
    ? `${t('admin.pos.stillDue')}: ${formatPrice(total - parsedCash)}`
    : null

  return (
    <div>
      <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">{t('admin.pos.paymentMethod')}</p>
      <div className="flex gap-2 mb-3 flex-wrap">
        {PAYMENT_METHODS.map((m) => (
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
            {t(m.labelKey)}
          </button>
        ))}
      </div>

      {paymentMethod === 'cash' && (
        <div className="space-y-2 mb-3">
          <div>
            <label className="text-xs text-white/40 font-medium">{t('admin.pos.amountTendered')} *</label>
            <div className="relative mt-1">
              <input
                type="number"
                step="0.01"
                min="0"
                value={cashAmount}
                onChange={(e) => onCashChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-3 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
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
                {formatPrice(amt)}
              </button>
            ))}
            <button
              onClick={() => onCashChange(total.toFixed(2))}
              className="px-2.5 py-1 rounded-md bg-gold/10 border border-gold/20 text-[11px] text-gold hover:bg-gold/20 transition-all font-medium"
            >
              <Calculator className="h-3 w-3 inline mr-0.5" />{t('admin.pos.exact')}
            </button>
          </div>

          {stillDue && (
            <div className="flex justify-between text-sm bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
              <span className="text-amber-400 font-medium">{stillDue}</span>
            </div>
          )}

          {parsedCash >= total && (
            <div className="flex justify-between text-sm bg-emerald-500/10 px-3 py-2.5 rounded-lg border border-emerald-500/20">
              <span className="text-emerald-400 font-medium">{t('admin.pos.changeDue')}</span>
              <span className="text-emerald-400 font-bold text-lg">{formatPrice(change)}</span>
            </div>
          )}
        </div>
      )}

      {paymentMethod === 'split' && (
        <div className="space-y-2 mb-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-white/40 font-medium">{t('admin.pos.cash')}</label>
              <div className="relative mt-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cashAmount}
                  onChange={(e) => onCashChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-3 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-white/40 font-medium">{t('admin.pos.card')}</label>
              <div className="relative mt-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cardAmount}
                  onChange={(e) => onCardChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-3 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-1.5">
            <button onClick={() => { onCashChange(total.toFixed(2)); onCardChange('0') }} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[11px] text-white/40 hover:bg-white/10 transition-all">{t('admin.pos.allCash')}</button>
            <button onClick={() => { onCashChange('0'); onCardChange(total.toFixed(2)) }} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[11px] text-white/40 hover:bg-white/10 transition-all">{t('admin.pos.allCard')}</button>
            <button onClick={() => { const half = (total / 2).toFixed(2); onCashChange(half); onCardChange(half) }} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[11px] text-white/40 hover:bg-white/10 transition-all">50/50</button>
          </div>

          {remaining > 0.01 && (
            <div className="text-xs text-amber-400/70 text-center">
              {t('admin.pos.remainingLabel')}: {formatPrice(remaining)}
            </div>
          )}

          {parsedCash + parsedCard >= total && (
            <div className="flex justify-between text-sm bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
              <div className="flex gap-4 text-xs">
                <span className="text-emerald-400">{t('admin.pos.cash')}: {formatPrice(parsedCash)}</span>
                <span className="text-emerald-400">{t('admin.pos.card')}: {formatPrice(parsedCard)}</span>
              </div>
              <span className="text-emerald-400 font-bold text-lg">={formatPrice(total)}</span>
            </div>
          )}
        </div>
      )}

      {paymentMethod === 'card' && (
        <div className="mb-3 bg-blue-500/5 px-3 py-2.5 rounded-lg border border-blue-500/20 text-center">
          <span className="text-blue-400 text-sm font-medium">{t('admin.pos.card')} {formatPrice(total)}</span>
        </div>
      )}

      {paymentMethod === 'bank_transfer' && (
        <div className="mb-3 bg-purple-500/5 px-3 py-2.5 rounded-lg border border-purple-500/20 text-center">
          <span className="text-purple-400 text-sm font-medium">{t('admin.pos.bankTransfer')} {formatPrice(total)}</span>
        </div>
      )}

      {paymentMethod === 'instapay' && (
        <div className="mb-3 bg-cyan-500/5 px-3 py-2.5 rounded-lg border border-cyan-500/20 text-center">
          <span className="text-cyan-400 text-sm font-medium">{t('admin.pos.instapay')} {formatPrice(total)}</span>
        </div>
      )}

      {paymentMethod === 'wallet' && (
        <div className="mb-3 bg-amber-500/5 px-3 py-2.5 rounded-lg border border-amber-500/20 text-center">
          <span className="text-amber-400 text-sm font-medium">{t('admin.pos.wallet')} {formatPrice(total)}</span>
        </div>
      )}
    </div>
  )
}

export default memo(PaymentSection)
