'use client'

type Props = {
  itemCount: number
  total: number
}

export default function CustomerDisplay({ itemCount, total }: Props) {
  return (
    <div className="fixed bottom-4 right-4 pos-glass-strong rounded-xl pos-glow p-4 min-w-[200px] text-center z-40">
      <p className="text-xs text-gold/60 uppercase tracking-wide mb-1">Customer Total</p>
      <p className="text-3xl font-bold text-gold">${total.toFixed(2)}</p>
      <p className="text-xs text-white/40 mt-1">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
    </div>
  )
}
