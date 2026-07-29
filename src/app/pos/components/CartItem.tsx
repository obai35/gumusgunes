'use client'

import { Minus, Plus, Trash2, Tag } from 'lucide-react'
import { memo, useState } from 'react'
import type { CartItem as CartItemType } from '../types'
import { formatPrice } from '@/lib/format'

type Props = {
  item: CartItemType
  onUpdateQuantity: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
  onSetDiscount?: (productId: string, discount: number) => void
}

function CartItemInner({ item, onUpdateQuantity, onRemove, onSetDiscount }: Props) {
  const [showDiscount, setShowDiscount] = useState(false)
  const [discountInput, setDiscountInput] = useState(item.discount ? item.discount.toString() : '')

  const lineTotal = item.price * item.quantity
  const discountedTotal = lineTotal - (item.discount || 0)

  const applyDiscount = () => {
    const val = parseFloat(discountInput) || 0
    const clamped = Math.min(Math.max(0, val), lineTotal)
    onSetDiscount?.(item.productId, clamped)
    setShowDiscount(false)
  }

  return (
    <div className="relative flex items-center gap-3 bg-white/5 rounded-lg p-2 border border-white/5">
      <div className="h-10 w-10 bg-white/5 rounded flex-shrink-0 overflow-hidden flex items-center justify-center">
        {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-silver-soft truncate">{item.name}</p>
          {(item.discount || 0) > 0 && (
            <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">-{formatPrice(item.discount!)}</span>
          )}
        </div>
        <p className="text-xs text-white/40">{formatPrice(item.price)} each</p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onUpdateQuantity(item.productId, -1)} className="h-6 w-6 rounded bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 text-white/60"><Minus className="h-3 w-3" /></button>
        <span className="w-6 text-center text-sm font-medium text-silver-soft">{item.quantity}</span>
        <button onClick={() => onUpdateQuantity(item.productId, 1)} className="h-6 w-6 rounded bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 text-white/60"><Plus className="h-3 w-3" /></button>
      </div>
      <div className="w-16 text-right">
        <span className={`text-sm font-bold ${(item.discount || 0) > 0 ? 'text-red-400' : 'text-gold'}`}>
          {formatPrice(discountedTotal)}
        </span>
      </div>
      <button onClick={() => setShowDiscount(!showDiscount)} className="text-white/30 hover:text-gold transition-colors"><Tag className="h-3.5 w-3.5" /></button>
      <button onClick={() => onRemove(item.productId)} className="text-red-400/60 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>

      {showDiscount && (
        <div className="absolute left-0 right-0 top-full mt-1 z-10 pos-glass-strong rounded-lg p-2 flex gap-2">
          <input
            value={discountInput}
            onChange={(e) => setDiscountInput(e.target.value)}
            placeholder="Discount"
            type="number"
            step="0.01"
            min="0"
            className="flex-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-silver-soft text-xs placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-gold/30"
            onKeyDown={(e) => { if (e.key === 'Enter') applyDiscount() }}
            autoFocus
          />
          <button onClick={applyDiscount} className="px-2 py-1 rounded bg-gold text-navy-deep text-xs font-semibold">Set</button>
        </div>
      )}
    </div>
  )
}

export default memo(CartItemInner)
