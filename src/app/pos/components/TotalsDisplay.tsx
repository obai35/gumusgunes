'use client'

type Props = {
  subtotal: number
  discountAmount: number
  total: number
}

export default function TotalsDisplay({ subtotal, discountAmount, total }: Props) {
  return (
    <div className="border-t border-white/10 pt-3 space-y-1">
      <div className="flex justify-between text-sm text-white/40">
        <span>Subtotal</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>
      {discountAmount > 0 && (
        <div className="flex justify-between text-sm text-emerald-400">
          <span>Discount</span>
          <span>-${discountAmount.toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-lg font-bold text-gold pt-1 border-t border-white/10">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  )
}
