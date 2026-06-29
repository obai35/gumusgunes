'use client'

import { useState, useCallback, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { SlidersHorizontal, X, Loader2 } from 'lucide-react'
import type { Product, Category } from '@/lib/types'
import { useTranslation } from '@/hooks/use-translation'
import { ProductCard } from '@/components/store/ProductCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/format'

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'rating'

interface Props {
  categories: Category[]
  initialProducts: Product[]
}

function ProductsPageContent({ categories, initialProducts }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useTranslation()

  const activeCategory = searchParams.get('category') || 'all'
  const sort = (searchParams.get('sort') as SortKey) || 'newest'
  const maxPrice = Number(searchParams.get('maxPrice')) || 500

  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const [visibleCount, setVisibleCount] = useState(8)
  const [showFilters, setShowFilters] = useState(false)

  const flatSubcategories = useMemo(
    () => categories.flatMap((c) => c.children || []),
    [categories]
  )

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all' && value !== 'newest' && value !== '500') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/products?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeCategory !== 'all') params.set('category', activeCategory)
      params.set('sort', sort)
      params.set('maxPrice', String(maxPrice))
      const res = await fetch(`/api/products?${params.toString()}`)
      const data = await res.json()
      if (data.ok) {
        setProducts(data.products)
        setVisibleCount(8)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [activeCategory, sort, maxPrice])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  return (
    <div>
      {/* Filter bar */}
      <div className="sticky top-20 z-30 -mx-4 sm:mx-0 mb-8 bg-background/80 backdrop-blur-lg border-y border-border/60 sm:rounded-full sm:border p-2 sm:p-3">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn('flex-shrink-0 inline-flex items-center gap-2 px-4 h-10 rounded-full text-xs font-semibold tracking-wide transition-colors', showFilters ? 'bg-navy text-silver' : 'bg-secondary text-navy hover:bg-secondary/70')}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {t('products.filter')}
          </button>

          <div className="h-6 w-px bg-border flex-shrink-0" />

          <button
            onClick={() => { updateParam('category', 'all'); setVisibleCount(8) }}
            className={cn('flex-shrink-0 px-4 h-10 rounded-full text-xs font-medium tracking-wide transition-colors whitespace-nowrap', activeCategory === 'all' ? 'bg-gold text-navy-deep' : 'bg-secondary text-navy hover:bg-secondary/70')}
          >
            {t('products.all')}
          </button>
          {flatSubcategories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => { updateParam('category', cat.slug); setVisibleCount(8) }}
              className={cn('flex-shrink-0 px-4 h-10 rounded-full text-xs font-medium tracking-wide transition-colors whitespace-nowrap', activeCategory === cat.slug ? 'bg-gold text-navy-deep' : 'bg-secondary text-navy hover:bg-secondary/70')}
            >
              {cat.name}
            </button>
          ))}

          <div className="flex-1" />
          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="flex-shrink-0 h-10 px-3 rounded-full bg-secondary text-navy text-xs font-medium border-0 focus:ring-2 focus:ring-gold cursor-pointer"
          >
            <option value="newest">{t('products.newest')}</option>
            <option value="price-asc">{t('products.priceLow')}</option>
            <option value="price-desc">{t('products.priceHigh')}</option>
            <option value="rating">{t('products.topRated')}</option>
          </select>
        </div>

        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-4 pt-4 pb-2 border-t border-border/50 mt-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-navy mb-2 block">
                  {t('products.maxPrice')} <span className="text-gold font-semibold">${maxPrice}</span>
                </label>
                <input type="range" min={50} max={500} step={10} value={maxPrice} onChange={(e) => updateParam('maxPrice', e.target.value)} className="w-full accent-gold" />
              </div>
              <button onClick={() => { router.push('/products'); setVisibleCount(8) }} className="px-4 h-9 rounded-full text-xs font-medium text-navy hover:text-gold transition-colors inline-flex items-center gap-1.5">
                <X className="h-3 w-3" />
                {t('products.reset')}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-6 text-sm">
        <p className="text-muted-foreground">
          {loading ? t('products.loading') : t('products.found', products.length)}
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-display text-2xl text-navy mb-2">{t('products.noMatch')}</p>
          <p className="text-muted-foreground text-sm mb-6">{t('products.tryWidening')}</p>
          <Button onClick={() => router.push('/products')} variant="outline" className="rounded-full">{t('products.resetFilters')}</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.slice(0, visibleCount).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
          {visibleCount < products.length && (
            <div className="text-center mt-12">
              <Button onClick={() => setVisibleCount((c) => c + 8)} variant="outline" className="rounded-full px-8 border-navy/30 text-navy hover:bg-navy hover:text-silver hover:border-navy">
                {t('products.loadMore')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ProductsPageClient(props: Props) {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>}>
      <ProductsPageContent {...props} />
    </Suspense>
  )
}
