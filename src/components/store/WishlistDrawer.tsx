'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { useUI, useWishlist, useCart } from '@/lib/store'
import { formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import type { Product } from '@/lib/types'

export function WishlistDrawer() {
  const { wishlistOpen, setWishlistOpen, setProductModal } = useUI()
  const wishlist = useWishlist()
  const { addItem } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!wishlistOpen || wishlist.ids.length === 0) return
    let cancelled = false
    const id = requestAnimationFrame(() => {
      if (!cancelled) setLoading(true)
    })
    fetch(`/api/products?limit=100`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d.ok) {
          setProducts(d.products.filter((p: Product) => wishlist.ids.includes(p.id)))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
      cancelAnimationFrame(id)
    }
  }, [wishlistOpen, wishlist.ids])

  return (
    <AnimatePresence>
      {wishlistOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70]"
        >
          <div className="absolute inset-0 bg-navy-deep/60 backdrop-blur-sm" onClick={() => setWishlistOpen(false)} />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-gold" />
                <h2 className="font-display text-xl font-semibold text-navy">Wishlist</h2>
                <span className="text-xs text-muted-foreground">({products.length})</span>
              </div>
              <button
                onClick={() => setWishlistOpen(false)}
                className="h-9 w-9 rounded-full hover:bg-secondary flex items-center justify-center"
              >
                <X className="h-5 w-5 text-navy" />
              </button>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Heart className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold text-navy mb-2">Your wishlist is empty</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                  Tap the heart icon on any piece to save it here for later.
                </p>
                <Button
                  onClick={() => setWishlistOpen(false)}
                  className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep px-6"
                >
                  Browse the Collection
                </Button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto scroll-luxury p-5 space-y-3">
                {products.map((p) => (
                  <div key={p.id} className="flex gap-3 group">
                    <button
                      onClick={() => { setWishlistOpen(false); setProductModal(p.id) }}
                      className="h-20 w-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0"
                    >
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-navy leading-snug line-clamp-2">{p.name}</h4>
                        <button
                          onClick={() => {
                            wishlist.toggle(p.id)
                            toast('Removed from wishlist')
                          }}
                          className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{p.category?.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold text-navy">{formatPrice(p.price)}</span>
                        <button
                          onClick={() => {
                            addItem(p, 1)
                            toast.success(`${p.name} added to bag`)
                          }}
                          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-navy text-silver text-xs font-medium hover:bg-gold hover:text-navy-deep transition-colors"
                        >
                          <ShoppingBag className="h-3 w-3" />
                          Add to Bag
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
