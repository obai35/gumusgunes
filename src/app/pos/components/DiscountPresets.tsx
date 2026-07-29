'use client'

import { memo, useMemo } from 'react'
import { Gift } from 'lucide-react'
import { formatPrice } from '@/lib/format'

type Props = {
  subtotal: number
  cartTotal: number
  cartLength: number
  onApplyPreset: (label: string, amount: number) => void
}

const PRESETS = [
  { label: '10%', getAmount: (subtotal: number) => Math.round(subtotal * 0.1 * 100) / 100 },
  { label: '15%', getAmount: (subtotal: number) => Math.round(subtotal * 0.15 * 100) / 100 },
  { label: '20%', getAmount: (subtotal: number) => Math.round(subtotal * 0.2 * 100) / 100 },
  { label: 'E£50', getAmount: () => 50 },
  { label: 'E£100', getAmount: () => 100 },
  { label: 'E£200', getAmount: () => 200 },
]

function DiscountPresets({ subtotal, cartLength, onApplyPreset }: Props) {
  const presets = useMemo(() =>
    PRESETS.map((p) => ({
      label: p.label,
      amount: p.getAmount(subtotal),
    })),
    [subtotal]
  )

  if (cartLength === 0) return null

  return (
    <div>
      <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-1.5 flex items-center gap-1">
        <Gift className="h-3 w-3" /> Quick Discount
      </p>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => onApplyPreset(p.label, p.amount)}
            className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-white/60 hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition-all"
          >
            {p.label}
            <span className="text-[10px] text-white/30 ml-0.5">(-{formatPrice(p.amount)})</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default memo(DiscountPresets)