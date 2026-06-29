'use client'

import { X } from 'lucide-react'
import type { AppliedDiscount } from '../types'

type Props = {
  discountCode: string
  onDiscountCodeChange: (code: string) => void
  onApplyDiscount: () => void
  appliedDiscount: AppliedDiscount | null
  onRemoveDiscount: () => void
  discountAmount: number
}

export default function DiscountSection({
  discountCode, onDiscountCodeChange, onApplyDiscount,
  appliedDiscount, onRemoveDiscount, discountAmount,
}: Props) {
  if (appliedDiscount) {
    return (
      <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg text-sm">
        <div>
          <span className="text-green-700 font-medium">Discount: -${discountAmount.toFixed(2)}</span>
          {appliedDiscount.appliesTo && appliedDiscount.appliesTo !== 'all' && (
            <span className="text-green-600 text-xs ml-2">({appliedDiscount.targetValue})</span>
          )}
        </div>
        <button onClick={onRemoveDiscount} className="text-green-500 hover:text-green-700"><X className="h-4 w-4" /></button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <input
        value={discountCode}
        onChange={(e) => onDiscountCodeChange(e.target.value.toUpperCase())}
        placeholder="Promo or employee code"
        className="flex-1 px-3 py-2 border border-border rounded-lg text-sm"
        onKeyDown={(e) => e.key === 'Enter' && onApplyDiscount()}
      />
      <button onClick={onApplyDiscount} className="px-3 py-2 bg-gray-100 text-navy rounded-lg text-sm hover:bg-gray-200 transition-colors">Apply</button>
    </div>
  )
}
