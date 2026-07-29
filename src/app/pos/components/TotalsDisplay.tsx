'use client'

import { memo } from 'react'
import { formatPrice } from '@/lib/format'
import { useTranslation } from '@/hooks/use-translation'

type Props = {
  subtotal: number
  discountAmount: number
  total: number
  itemDiscountTotal?: number
  couponDiscount?: number
  taxAmount?: number
}

function TotalsDisplay({ subtotal, discountAmount, total, itemDiscountTotal, couponDiscount, taxAmount }: Props) {
  const { t } = useTranslation()
  return (
    <div className="border-t border-white/10 pt-3 space-y-1">
      <div className="flex justify-between text-sm text-white/40">
        <span>{t('admin.pos.subtotal')}</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      {(itemDiscountTotal || 0) > 0 && (
        <div className="flex justify-between text-sm text-red-400">
          <span>{t('admin.pos.itemDiscounts')}</span>
          <span>-{formatPrice(itemDiscountTotal || 0)}</span>
        </div>
      )}
      {(couponDiscount || 0) > 0 && (
        <div className="flex justify-between text-sm text-emerald-400">
          <span>{t('admin.pos.couponDiscount')}</span>
          <span>-{formatPrice(couponDiscount || 0)}</span>
        </div>
      )}
      {(taxAmount || 0) > 0 && (
        <div className="flex justify-between text-sm text-white/50">
          <span>{t('admin.pos.tax')}</span>
          <span>{formatPrice(taxAmount || 0)}</span>
        </div>
      )}
      <div className="flex justify-between text-lg font-bold text-gold pt-1 border-t border-white/10">
        <span>{t('admin.pos.total')}</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  )
}

export default memo(TotalsDisplay)
