'use client'

type Props = {
  subtotal: number
  discountAmount: number
  total: number
}

export default function TotalsDisplay({ subtotal, discountAmount, total }: Props) {
  return (
    <div className="border-t border-border pt-3 space-y-1">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Subtotal</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>
      {discountAmount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Discount</span>
          <span>-${discountAmount.toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-lg font-bold text-navy pt-1 border-t border-border">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  )
}
