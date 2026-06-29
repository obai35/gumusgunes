'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { memo } from 'react'
import type { CartItem as CartItemType } from '../types'

type Props = {
  item: CartItemType
  onUpdateQuantity: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
}

function CartItemInner({ item, onUpdateQuantity, onRemove }: Props) {
  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-lg p-2 border border-white/5">
      <div className="h-10 w-10 bg-white/5 rounded flex-shrink-0 overflow-hidden flex items-center justify-center">
        {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-silver-soft truncate">{item.name}</p>
        <p className="text-xs text-white/40">${item.price.toFixed(2)} each</p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onUpdateQuantity(item.productId, -1)} className="h-6 w-6 rounded bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 text-white/60"><Minus className="h-3 w-3" /></button>
        <span className="w-6 text-center text-sm font-medium text-silver-soft">{item.quantity}</span>
        <button onClick={() => onUpdateQuantity(item.productId, 1)} className="h-6 w-6 rounded bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 text-white/60"><Plus className="h-3 w-3" /></button>
      </div>
      <span className="text-sm font-bold text-gold w-16 text-right">${(item.price * item.quantity).toFixed(2)}</span>
      <button onClick={() => onRemove(item.productId)} className="text-red-400/60 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
    </div>
  )
}

export default memo(CartItemInner)
