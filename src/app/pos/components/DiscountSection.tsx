'use client'

import { memo } from 'react'
import { X } from 'lucide-react'
import type { AppliedDiscount } from '../types'
import { formatPrice } from '@/lib/format'
import { useTranslation } from '@/hooks/use-translation'

type Props = {
  discountCode: string
  onDiscountCodeChange: (code: string) => void
  onApplyDiscount: () => void
  appliedDiscount: AppliedDiscount | null
  onRemoveDiscount: () => void
  discountAmount: number
}

function DiscountSection({
  discountCode, onDiscountCodeChange,
  onApplyDiscount,
  appliedDiscount, onRemoveDiscount,
  discountAmount,
}: Props) {
  const { t } = useTranslation()
  if (appliedDiscount) {
    return (
      <div className="flex items-center justify-between bg-emerald-500/10 px-3 py-2 rounded-lg text-sm border border-emerald-500/20">
        <div>
          <span className="text-emerald-400 font-medium">{t('admin.pos.discount')}: -{formatPrice(discountAmount)}</span>
          {appliedDiscount.appliesTo && appliedDiscount.appliesTo !== 'all' && (
            <span className="text-emerald-400/60 text-xs ml-2">({appliedDiscount.targetValue})</span>
          )}
        </div>
        <button onClick={onRemoveDiscount} className="text-emerald-400/60 hover:text-emerald-400"><X className="h-4 w-4" /></button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <input
        value={discountCode}
        onChange={(e) => onDiscountCodeChange(e.target.value.toUpperCase())}
        placeholder={t('admin.pos.promoCode')}
        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
        onKeyDown={(e) => e.key === 'Enter' && onApplyDiscount()}
      />
      <button onClick={onApplyDiscount} className="px-3 py-2 bg-gold/15 text-gold rounded-lg text-sm font-medium hover:bg-gold/25 transition-all border border-gold/20">{t('admin.pos.apply')}</button>
    </div>
  )
}

export default memo(DiscountSection)
