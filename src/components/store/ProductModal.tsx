'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Heart, ShoppingBag, Star, Truck, ShieldCheck, RefreshCw, Minus, Plus, ChevronRight,
} from 'lucide-react'
import { useUI, useCart, useWishlist } from '@/lib/store'
import type { Product, Review } from '@/lib/types'
import { formatPrice, parseTags, discountPercent, formatDate, cn } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type DetailData = {
  product: Product
  related: Product[]
  reviews: Review[]
}

export function ProductModal() {
  const { productModalId, setProductModal } = useUI()
  const { addItem } = useCart()
  const wishlist = useWishlist()
  const [data, setData] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(false)
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    if (!productModalId) return
    let cancelled = false
    // Defer loading state to avoid synchronous setState in effect
    const id = requestAnimationFrame(() => {
      if (cancelled) return
      setLoading(true)
      setQty(1)
      setActiveImage(0)
    })
    fetch(`/api/products/${productModalId}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d.ok) setData(d)
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    // Lock body scroll
    document.body.style.overflow = 'hidden'
    return () => {
      cancelled = true
      cancelAnimationFrame(id)
      document.body.style.overflow = ''
    }
  }, [productModalId])

  if (!productModalId) return null

  const product = data?.product
  const reviews = data?.reviews ?? []
  const related = data?.related ?? []
  const isWishlisted = product ? wishlist.has(product.id) : false

  const handleAdd = () => {
    if (!product) return
    addItem(product, qty)
    toast.success(`${product.name} × ${qty} added to bag`)
    setProductModal(null)
  }

  return (
    <AnimatePresence>
      {productModalId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6"
        >
          <div
            className="absolute inset-0 bg-navy-deep/70 backdrop-blur-sm"
            onClick={() => setProductModal(null)}
          />

          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative bg-background rounded-t-3xl sm:rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Close */}
            <button
              onClick={() => setProductModal(null)}
              className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-md border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <X className="h-5 w-5 text-navy" />
            </button>

            {loading || !product ? (
              <div className="flex justify-center items-center py-32">
                <div className="h-8 w-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 overflow-y-auto scroll-luxury">
                {/* Image column */}
                <div className="relative bg-secondary">
                  <div className="aspect-square relative">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {product.isNew && (
                        <span className="px-3 py-1 rounded-full bg-navy text-silver text-[10px] font-semibold tracking-[0.15em] uppercase">
                          New
                        </span>
                      )}
                      {product.isBestseller && (
                        <span className="px-3 py-1 rounded-full bg-gold text-navy-deep text-[10px] font-semibold tracking-[0.15em] uppercase">
                          Bestseller
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Thumbnails (just the same image repeated for demo) */}
                  <div className="p-3 flex gap-2">
                    {[product.imageUrl, product.imageUrl, product.imageUrl].map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={cn(
                          'h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors',
                          activeImage === i ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'
                        )}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info column */}
                <div className="p-6 sm:p-8 flex flex-col">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="tracking-[0.2em] uppercase">{product.category?.name}</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="truncate">{product.sku}</span>
                  </div>

                  <h2 className="font-display text-3xl sm:text-4xl font-semibold text-navy leading-tight mb-3">
                    {product.name}
                  </h2>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            'h-4 w-4',
                            s <= Math.round(product.rating)
                              ? 'fill-gold text-gold'
                              : 'fill-muted text-muted'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-navy">{product.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({product.reviewCount} reviews)</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-3xl font-semibold text-navy">{formatPrice(product.price)}</span>
                    {product.compareAtPrice && (
                      <>
                        <span className="text-base text-muted-foreground line-through">
                          {formatPrice(product.compareAtPrice)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
                          Save {formatPrice(product.compareAtPrice - product.price)}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {product.description}
                  </p>

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-xl bg-secondary/50">
                    <div>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-0.5">Material</p>
                      <p className="text-sm font-medium text-navy">{product.material}</p>
                    </div>
                    <div>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-0.5">Weight</p>
                      <p className="text-sm font-medium text-navy">{product.weight || '—'}</p>
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="flex items-center gap-2 mb-5 text-sm">
                    <div className={cn(
                      'h-2 w-2 rounded-full',
                      product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-gold' : 'bg-destructive'
                    )} />
                    <span className="text-navy font-medium">
                      {product.stock > 10
                        ? 'In stock'
                        : product.stock > 0
                          ? `Only ${product.stock} left`
                          : 'Out of stock'}
                    </span>
                  </div>

                  {/* Quantity + Add */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center border border-border rounded-full">
                      <button
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="h-11 w-11 flex items-center justify-center text-navy hover:text-gold transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-semibold text-navy">{qty}</span>
                      <button
                        onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                        className="h-11 w-11 flex items-center justify-center text-navy hover:text-gold transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <Button
                      onClick={handleAdd}
                      disabled={product.stock === 0}
                      className="flex-1 h-11 rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep transition-colors text-sm font-semibold tracking-wide"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Add to Bag · {formatPrice(product.price * qty)}
                    </Button>
                    <button
                      onClick={() => {
                        wishlist.toggle(product.id)
                        toast(isWishlisted ? 'Removed from wishlist' : 'Saved to wishlist')
                      }}
                      className={cn(
                        'h-11 w-11 rounded-full border flex items-center justify-center transition-colors',
                        isWishlisted
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-border text-navy hover:text-gold hover:border-gold'
                      )}
                    >
                      <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
                    </button>
                  </div>

                  {/* Trust */}
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50 mb-6">
                    {[
                      { icon: Truck, label: 'Free shipping over $250' },
                      { icon: ShieldCheck, label: 'Lifetime warranty' },
                      { icon: RefreshCw, label: '30-day returns' },
                    ].map((t) => (
                      <div key={t.label} className="flex flex-col items-center text-center gap-1.5">
                        <t.icon className="h-4 w-4 text-gold" />
                        <span className="text-[10px] text-muted-foreground leading-tight">{t.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tags */}
                  {parseTags(product.tags).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {parseTags(product.tags).map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-full bg-secondary text-[11px] text-muted-foreground tracking-wide"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Reviews */}
                  {reviews.length > 0 && (
                    <div className="mt-2">
                      <h3 className="font-display text-lg font-semibold text-navy mb-3">
                        Customer Reviews ({reviews.length})
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto scroll-luxury pr-2">
                        {reviews.map((r) => (
                          <div key={r.id} className="p-3 rounded-xl bg-secondary/40">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={cn(
                                        'h-3 w-3',
                                        s <= r.rating ? 'fill-gold text-gold' : 'fill-muted text-muted'
                                      )}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs font-medium text-navy">{r.authorName}</span>
                                {r.isVerified && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-700">
                                    Verified
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground">{formatDate(r.createdAt)}</span>
                            </div>
                            <p className="text-sm font-medium text-navy mb-0.5">{r.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{r.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related */}
                  {related.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-display text-lg font-semibold text-navy mb-3">You may also love</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {related.slice(0, 4).map((rp) => (
                          <button
                            key={rp.id}
                            onClick={() => setProductModal(rp.id)}
                            className="group relative aspect-square rounded-lg overflow-hidden bg-secondary"
                          >
                            <img
                              src={rp.imageUrl}
                              alt={rp.name}
                              className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-navy-deep/0 group-hover:bg-navy-deep/30 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
