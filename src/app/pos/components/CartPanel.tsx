'use client'

import { ShoppingCart } from 'lucide-react'
import { type ReactNode } from 'react'
import type { CartItem as CartItemType } from '../types'
import CartItemComponent from './CartItem'

type Props = {
  cart: CartItemType[]
  onUpdateQuantity: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
  discountSection: ReactNode
  paymentSection: ReactNode
  totalsDisplay: ReactNode
  checkoutButton: ReactNode
}

export default function CartPanel({ cart, onUpdateQuantity, onRemove, discountSection, paymentSection, totalsDisplay, checkoutButton }: Props) {
  return (
    <div className="w-[380px] flex flex-col pos-glass-strong rounded-xl shrink-0 self-start sticky top-0 max-h-[calc(100dvh-3rem)]">
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h2 className="font-semibold text-silver-soft flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-gold" /> Cart ({cart.length})</h2>
          {cart.length > 0 && (
            <button onClick={() => cart.forEach(item => onRemove(item.productId))} className="text-xs text-white/40 hover:text-red-400 transition-colors">
              Clear all
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0 scroll-luxury">
          {cart.map((item) => (
            <CartItemComponent key={item.productId} item={item} onUpdateQuantity={onUpdateQuantity} onRemove={onRemove} />
          ))}
          {cart.length === 0 && (
            <p className="text-white/30 text-sm text-center pt-4">Cart is empty. Search and click products to add.</p>
          )}
        </div>

        <div className="flex-shrink-0 space-y-3">
          {discountSection}
          {paymentSection}
          {totalsDisplay}
          {checkoutButton}
        </div>
      </div>
    </div>
  )
}
