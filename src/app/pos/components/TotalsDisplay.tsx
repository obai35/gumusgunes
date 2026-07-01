'use client'

import { memo } from 'react'

type Props = {
  subtotal: number
  discountAmount: number
  total: number
  itemDiscountTotal?: number
  couponDiscount?: number
}

function TotalsDisplay({ subtotal, discountAmount, total, itemDiscountTotal, couponDiscount }: Props) {
  return (
    <div className="border-t border-white/10 pt-3 space-y-1">
      <div className="flex justify-between text-sm text-white/40">
        <span>Subtotal</span>
        <span>E£{subtotal.toFixed(2)}</span>
      </div>
      {(itemDiscountTotal || 0) > 0 && (
        <div className="flex justify-between text-sm text-red-400">
          <span>Item Discounts</span>
          <span>-E£{(itemDiscountTotal || 0).toFixed(2)}</span>
        </div>
      )}
      {(couponDiscount || 0) > 0 && (
        <div className="flex justify-between text-sm text-emerald-400">
          <span>Coupon Discount</span>
          <span>-E£{(couponDiscount || 0).toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-lg font-bold text-gold pt-1 border-t border-white/10">
        <span>Total</span>
        <span>E£{total.toFixed(2)}</span>
      </div>
    </div>
  )
}

export default memo(TotalsDisplay)
