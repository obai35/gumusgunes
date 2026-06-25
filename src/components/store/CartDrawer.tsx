'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight, Truck, Sparkles, Plus as PlusIcon } from 'lucide-react'
import { useCart, useUI } from '@/lib/store'
import { cn } from '@/lib/format'
import { useFormatPrice } from '@/hooks/use-format-price'
import { useTranslation } from '@/hooks/use-translation'
import { Button } from '@/components/ui/button'
import type { Product } from '@/lib/types'
import { toast } from 'sonner'

const FREE_SHIPPING_THRESHOLD = 250

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal, addItem } = useCart()
  const { setCheckoutOpen } = useUI()
  const formatPrice = useFormatPrice()
  const { t } = useTranslation()
  const [recommendations, setRecommendations] = useState<Product[]>([])

  const total = subtotal()
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  const progress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100)

  // Fetch "Complete the Look" recommendations based on cart contents
  useEffect(() => {
    if (!isOpen || items.length === 0) {
      return
    }
    let cancelled = false
    const rafId = requestAnimationFrame(() => {
      if (cancelled) return
    })
    fetch('/api/products?limit=20')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.ok) return
        const cartIds = new Set(items.map((i) => i.product.id))
        const cartCategoryIds = new Set(items.map((i) => i.product.categoryId))
        // Prefer products from different categories than what's in the cart
        const recs = (d.products as Product[])
          .filter((p) => !cartIds.has(p.id))
          .sort((a, b) => {
            const aDiff = cartCategoryIds.has(a.categoryId) ? 0 : 1
            const bDiff = cartCategoryIds.has(b.categoryId) ? 0 : 1
            if (aDiff !== bDiff) return bDiff - aDiff
            return Number(b.isBestseller) - Number(a.isBestseller)
          })
          .slice(0, 3)
        if (!cancelled) setRecommendations(recs)
      })
      .catch(() => {})
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [isOpen, items])

  const handleCheckout = () => {
    closeCart()
    setCheckoutOpen(true)
  }

  const handleAddRec = (product: Product) => {
    addItem(product, 1)
    toast.success(t('cart.addedToBag', product.name))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70]"
        >
          <div className="absolute inset-0 bg-navy-deep/60 backdrop-blur-sm" onClick={closeCart} />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-gold" />
                <h2 className="font-display text-xl font-semibold text-navy">
                  {t('cart.title')}
                </h2>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </div>
              <button
                onClick={closeCart}
                className="h-9 w-9 rounded-full hover:bg-secondary flex items-center justify-center"
              >
                <X className="h-5 w-5 text-navy" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold text-navy mb-2">{t('cart.empty')}</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                  {t('cart.emptyDesc')}
                </p>
                <Button
                  onClick={closeCart}
                  className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep px-6"
                >
                  {t('cart.startShopping')}
                </Button>
              </div>
            ) : (
              <>
                {/* Free shipping progress */}
                <div className="px-5 py-3 bg-secondary/40 border-b border-border/50">
                  <div className="flex items-center gap-2 text-xs text-navy mb-2">
                    <Truck className="h-4 w-4 text-gold flex-shrink-0" />
                    {remaining > 0 ? (
                      <span>{t('cart.freeShipping', formatPrice(remaining))}</span>
                    ) : (
                      <span className="text-gold font-medium">{t('cart.freeShippingAchieved')}</span>
                    )}
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-gold to-gold-soft"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto scroll-luxury p-5 space-y-4">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3 group">
                      <div className="h-20 w-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-navy leading-snug line-clamp-2">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                            aria-label={t('cart.removeAria')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {item.product.material.split('·')[0].trim()}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-border rounded-full">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="h-7 w-7 flex items-center justify-center text-navy hover:text-gold"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-7 text-center text-xs font-semibold text-navy">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="h-7 w-7 flex items-center justify-center text-navy hover:text-gold"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-navy">
                            {formatPrice(item.product.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Complete the Look */}
                  {recommendations.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-dashed border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-gold" />
                        <h3 className="font-display text-sm font-semibold text-navy">{t('cart.completeLook')}</h3>
                      </div>
                      <div className="space-y-2">
                        {recommendations.map((rec) => (
                          <div
                            key={rec.id}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/60 transition-colors group"
                          >
                            <div className="h-14 w-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                              <img
                                src={rec.imageUrl}
                                alt={rec.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-navy line-clamp-1">{rec.name}</p>
                              <p className="text-xs text-gold font-semibold mt-0.5">{formatPrice(rec.price)}</p>
                            </div>
                            <button
                              onClick={() => handleAddRec(rec)}
                              className="h-8 w-8 rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep transition-colors flex items-center justify-center flex-shrink-0"
                              aria-label={`Add ${rec.name}`}
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-border p-5 space-y-3 bg-background">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                    <span className="font-semibold text-navy">{formatPrice(total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('cart.shipping')}</span>
                    <span className="font-semibold text-navy">
                      {total >= FREE_SHIPPING_THRESHOLD ? (
                        <span className="text-gold">{t('cart.free')}</span>
                      ) : (
                        formatPrice(15)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('cart.tax')}</span>
                    <span className="font-semibold text-navy">{formatPrice(total * 0.18)}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex items-center justify-between">
                    <span className="font-display text-base font-semibold text-navy">{t('cart.total')}</span>
                    <span className="font-display text-xl font-semibold gold-text">
                      {formatPrice(total + (total >= FREE_SHIPPING_THRESHOLD ? 0 : 15) + total * 0.18)}
                    </span>
                  </div>
                  <Button
                    onClick={handleCheckout}
                    className="w-full h-12 rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep transition-colors font-semibold tracking-wide"
                  >
                    {t('cart.checkout')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <button
                    onClick={closeCart}
                    className="w-full text-center text-xs text-muted-foreground hover:text-navy transition-colors py-1"
                  >
                    {t('cart.continueShopping')}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
