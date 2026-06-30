'use client'

import { memo, useState } from 'react'
import { ShoppingCart, PauseCircle, PlayCircle, X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { CartItem as CartItemType, HeldOrder } from '../types'
import CartItemComponent from './CartItem'

type Props = {
  cart: CartItemType[]
  onUpdateQuantity: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
  onSetDiscount?: (productId: string, discount: number) => void
  discountSection: ReactNode
  paymentSection: ReactNode
  totalsDisplay: ReactNode
  checkoutButton: ReactNode
  heldOrders?: HeldOrder[]
  onHoldOrder?: (label?: string) => void
  onRecallOrder?: (order: HeldOrder) => void
  onRemoveHeldOrder?: (id: string) => void
}

function CartPanel({ cart, onUpdateQuantity, onRemove, onSetDiscount, discountSection, paymentSection, totalsDisplay, checkoutButton, heldOrders, onHoldOrder, onRecallOrder, onRemoveHeldOrder }: Props) {
  const [showHeldOrders, setShowHeldOrders] = useState(false)
  const [holdLabel, setHoldLabel] = useState('')
  const [showHoldPrompt, setShowHoldPrompt] = useState(false)

  return (
    <div className="w-[380px] flex flex-col pos-glass-strong rounded-xl shrink-0 self-start sticky top-0 max-h-[calc(100dvh-3rem)] border-gold/20">
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
            <CartItemComponent key={item.productId} item={item} onUpdateQuantity={onUpdateQuantity} onRemove={onRemove} onSetDiscount={onSetDiscount} />
          ))}
          {cart.length === 0 && !showHeldOrders && (
            <p className="text-white/30 text-sm text-center pt-4">Cart is empty. Search and click products to add.</p>
          )}
        </div>

        {cart.length > 0 && (
          <div className="flex-shrink-0 flex gap-2 mb-3">
            <button onClick={() => setShowHoldPrompt(true)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-white/10 text-xs text-white/40 hover:text-white/60 hover:border-white/20 transition-all">
              <PauseCircle className="h-3.5 w-3.5" /> Hold
            </button>
            {(heldOrders && heldOrders.length > 0) && (
              <button onClick={() => setShowHeldOrders(!showHeldOrders)} className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-dashed border-white/10 text-xs text-white/40 hover:text-white/60 hover:border-white/20 transition-all">
                <PlayCircle className="h-3.5 w-3.5" /> Held ({heldOrders.length})
              </button>
            )}
          </div>
        )}

        {showHeldOrders && heldOrders && heldOrders.length > 0 && (
          <div className="flex-shrink-0 mb-3 space-y-1.5">
            <p className="text-[11px] text-white/30 font-medium uppercase tracking-wider">Held Orders</p>
            {heldOrders.map((held) => (
              <div key={held.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-2 border border-white/5">
                <button onClick={() => onRecallOrder?.(held)} className="flex-1 text-left">
                  <p className="text-xs font-medium text-silver-soft">{held.label}</p>
                  <p className="text-[11px] text-white/40">{held.items.length} items · ${held.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</p>
                </button>
                <button onClick={() => onRemoveHeldOrder?.(held.id)} className="text-white/20 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}

        {showHoldPrompt && (
          <div className="flex-shrink-0 mb-3 pos-glass rounded-lg p-2.5 flex gap-2">
            <input
              value={holdLabel}
              onChange={(e) => setHoldLabel(e.target.value)}
              placeholder="Order label (optional)"
              className="flex-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-silver-soft text-xs placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-gold/30"
              onKeyDown={(e) => { if (e.key === 'Enter') { onHoldOrder?.(holdLabel); setShowHoldPrompt(false); setHoldLabel('') } }}
              autoFocus
            />
            <button onClick={() => { onHoldOrder?.(holdLabel); setShowHoldPrompt(false); setHoldLabel('') }} className="px-3 py-1 rounded bg-gold text-navy-deep text-xs font-semibold">Save</button>
            <button onClick={() => setShowHoldPrompt(false)} className="px-2 py-1 rounded text-white/30 hover:text-white/60 text-xs">Cancel</button>
          </div>
        )}

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

export default memo(CartPanel)
