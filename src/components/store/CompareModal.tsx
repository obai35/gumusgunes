'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Minus, Star, Trash2, ShoppingBag, GitCompare } from 'lucide-react'
import { useCompare, useCart, useUI } from '@/lib/store'
import { useTranslation } from '@/hooks/use-translation'
import { useFormatPrice } from '@/hooks/use-format-price'
import { useHydrated } from '@/hooks/use-hydrated'
import { parseTags, cn } from '@/lib/format'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { Product } from '@/lib/types'

export function CompareModal() {
  const hydrated = useHydrated()
  const { ids, isOpen, setOpen, clear, toggle } = useCompare()
  const { addItem } = useCart()
  const { setProductModal } = useUI()
  const { t } = useTranslation()
  const formatPrice = useFormatPrice()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || ids.length === 0) return
    let cancelled = false
    const rafId = requestAnimationFrame(() => {
      if (!cancelled) setLoading(true)
    })
    Promise.all(ids.map((id) => fetch(`/api/products/${id}`).then((r) => r.json())))
      .then((results) => {
        if (cancelled) return
        const found = results.filter((r) => r.ok).map((r) => r.product as Product)
        setProducts(found)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [isOpen, ids])

  if (!hydrated || !isOpen) return null

  const handleAdd = (p: Product) => {
    addItem(p, 1)
    toast.success(`${p.name} added to bag`)
  }

  // Helper to render a comparison cell value
  const Cell = ({ value, type }: { value: string | number | null; type?: 'check' | 'text' | 'rating' }) => {
    if (value === null || value === undefined || value === '') {
      return <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />
    }
    if (type === 'check') {
      return value ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />
    }
    if (type === 'rating') {
      return (
        <span className="inline-flex items-center gap-1">
          <Star className="h-3 w-3 fill-gold text-gold" />
          <span className="font-medium text-navy">{Number(value).toFixed(1)}</span>
        </span>
      )
    }
    return <span className="text-sm text-navy text-center">{value}</span>
  }

  const rows: { label: string; key: (p: Product) => string | number | null; type?: 'check' | 'text' | 'rating' }[] = [
    { label: 'compare.rows.price', key: (p) => formatPrice(p.price) },
    { label: 'compare.rows.material', key: (p) => p.material.split('·')[0].trim() },
    { label: 'compare.rows.fullMaterial', key: (p) => p.material },
    { label: 'compare.rows.weight', key: (p) => p.weight },
    { label: 'compare.rows.category', key: (p) => p.category?.name ?? '—' },
    { label: 'compare.rows.rating', key: (p) => p.rating, type: 'rating' },
    { label: 'compare.rows.reviews', key: (p) => p.reviewCount },
    { label: 'compare.rows.inStock', key: (p) => p.stock, type: 'check' },
    { label: 'compare.rows.bestseller', key: (p) => (p.isBestseller ? t('compare.yes') : t('compare.no')), type: 'check' },
    { label: 'compare.rows.newArrival', key: (p) => (p.isNew ? t('compare.yes') : t('compare.no')), type: 'check' },
    { label: 'compare.rows.sku', key: (p) => p.sku },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6"
        >
          <div className="absolute inset-0 bg-navy-deep/70 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative bg-background rounded-t-3xl sm:rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-navy text-silver">
              <div className="flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-gold" />
                <h2 className="font-display text-2xl font-semibold">{t('compare.compare')}</h2>
                <span className="text-xs text-silver/60">({products.length}/3)</span>
              </div>
              <div className="flex items-center gap-2">
                {products.length > 0 && (
                  <button
                    onClick={clear}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-xs text-silver/70 hover:text-silver hover:bg-silver/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('compare.clear')}
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="h-9 w-9 rounded-full hover:bg-silver/10 flex items-center justify-center"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-auto scroll-luxury flex-1">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="h-8 w-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                    <GitCompare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-navy mb-2">{t('compare.emptyTitle')}</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                    {t('compare.emptyDesc')}
                  </p>
                  <Button onClick={() => setOpen(false)} className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep">
                    {t('compare.emptyCta')}
                  </Button>
                </div>
              ) : (
                <div className="min-w-full">
                  {/* Product header row */}
                  <div className="grid sticky top-0 bg-background z-10" style={{ gridTemplateColumns: `140px repeat(${products.length}, 1fr)` }}>
                    <div className="p-4 border-b border-border bg-secondary/30" />
                    {products.map((p) => (
                      <div key={p.id} className="p-4 border-b border-l border-border">
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary mb-3 image-zoom">
                          <img src={p.imageUrl} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                          <button
                            onClick={() => toggle(p.id)}
                            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/90 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <h3
                          className="font-display text-sm font-semibold text-navy leading-snug line-clamp-2 mb-1 cursor-pointer hover:text-gold transition-colors"
                          onClick={() => { setOpen(false); setProductModal(p.id) }}
                        >
                          {p.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">{p.category?.name}</p>
                        <p className="font-display text-lg font-semibold gold-text mb-3">{formatPrice(p.price)}</p>
                        <Button
                          onClick={() => handleAdd(p)}
                          size="sm"
                          className="w-full h-9 rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep text-xs"
                        >
                          <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
                          {t('products.addToBag')}
                        </Button>
                      </div>
                    ))}
                    {/* Fill empty slots */}
                    {Array.from({ length: 3 - products.length }).map((_, i) => (
                      <div key={`empty-${i}`} className="p-4 border-b border-l border-border bg-secondary/20">
                        <div className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center mb-3">
                          <span className="text-xs text-muted-foreground">{t('compare.emptySlot')}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comparison rows */}
                  {rows.map((row, ri) => (
                    <div
                      key={row.label}
                      className="grid border-b border-border/50"
                      style={{ gridTemplateColumns: `140px repeat(${products.length}, 1fr)` }}
                    >
                      <div className={cn('p-3 text-xs font-semibold text-muted-foreground tracking-wide uppercase bg-secondary/20', ri % 2 === 1 && 'bg-secondary/40')}>
                        {t(row.label)}
                      </div>
                      {products.map((p) => (
                        <div
                          key={p.id}
                          className={cn('p-3 flex items-center justify-center text-center border-l border-border/50', ri % 2 === 1 && 'bg-secondary/20')}
                        >
                          <Cell value={row.key(p)} type={row.type} />
                        </div>
                      ))}
                      {Array.from({ length: 3 - products.length }).map((_, i) => (
                        <div key={`empty-r-${ri}-${i}`} className={cn('p-3 border-l border-border/50', ri % 2 === 1 && 'bg-secondary/20')} />
                      ))}
                    </div>
                  ))}

                  {/* Tags row */}
                  <div className="grid border-b border-border/50" style={{ gridTemplateColumns: `140px repeat(${products.length}, 1fr)` }}>
                    <div className="p-3 text-xs font-semibold text-muted-foreground tracking-wide uppercase bg-secondary/20">{t('compare.rows.tags')}</div>
                    {products.map((p) => (
                      <div key={p.id} className="p-3 border-l border-border/50 flex flex-wrap gap-1 justify-center">
                        {parseTags(p.tags).slice(0, 3).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    ))}
                    {Array.from({ length: 3 - products.length }).map((_, i) => (
                      <div key={`empty-t-${i}`} className="p-3 border-l border-border/50" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile clear button */}
            {products.length > 0 && (
              <div className="sm:hidden p-3 border-t border-border">
                <button
                  onClick={clear}
                  className="w-full h-10 rounded-full text-xs text-muted-foreground hover:text-destructive transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('compare.clear')}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
