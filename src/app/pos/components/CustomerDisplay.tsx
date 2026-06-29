'use client'

type Props = {
  itemCount: number
  total: number
}

export default function CustomerDisplay({ itemCount, total }: Props) {
  return (
    <div className="fixed bottom-4 right-4 bg-navy text-silver rounded-xl shadow-lg p-4 min-w-[200px] text-center z-40">
      <p className="text-xs text-silver/70 uppercase tracking-wide mb-1">Customer Total</p>
      <p className="text-3xl font-bold text-gold">${total.toFixed(2)}</p>
      <p className="text-xs text-silver/50 mt-1">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
    </div>
  )
}
