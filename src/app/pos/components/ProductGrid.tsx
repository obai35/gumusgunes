'use client'

import { memo, useRef, useMemo, useEffect, useCallback } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Product, Category } from '../types'

const COLUMNS = 3
const ROW_HEIGHT = 120

type Props = {
  products: Product[]
  search: string
  onSearchChange: (value: string) => void
  onAddToCart: (product: Product) => void
  categories?: Category[]
  selectedCategoryId?: string | null
  onCategoryChange?: (id: string | null) => void
  hasMore?: boolean
  loading?: boolean
  onLoadMore?: () => void
}

function ProductGrid({ products, search, onSearchChange, onAddToCart, categories, selectedCategoryId, onCategoryChange, hasMore, loading, onLoadMore }: Props) {
  const rows = useMemo(() => {
    const result: Product[][] = []
    for (let i = 0; i < products.length; i += COLUMNS) {
      result.push(products.slice(i, i + COLUMNS))
    }
    return result
  }, [products])

  const parentRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: hasMore ? rows.length + 1 : rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 4,
  })

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !onLoadMore || !hasMore || loading) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onLoadMore()
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [onLoadMore, hasMore, loading])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value)
  }, [onSearchChange])

  const handleCategoryChange = useCallback((id: string | null) => {
    onCategoryChange?.(id)
  }, [onCategoryChange])

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      {categories && categories.length > 0 && (
        <div className="flex gap-1.5 mb-2 flex-shrink-0 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => handleCategoryChange(null)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${!selectedCategoryId ? 'bg-gold text-navy-deep' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${selectedCategoryId === cat.id ? 'bg-gold text-navy-deep' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="relative mb-2 flex-shrink-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
        <input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name or SKU..."
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-silver-soft text-xs placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
          autoFocus
        />
      </div>

      <div ref={parentRef} className="flex-1 overflow-y-auto min-h-0 scroll-luxury">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const isLoader = virtualRow.index >= rows.length
            if (isLoader) {
              return (
                <div
                  key="loader"
                  ref={loadMoreRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${ROW_HEIGHT}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="flex items-center justify-center"
                >
                  {loading && (
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading more...
                    </div>
                  )}
                  {!hasMore && products.length > 0 && (
                    <span className="text-white/20 text-[10px]">All products loaded</span>
                  )}
                </div>
              )
            }

            const rowProducts = rows[virtualRow.index]
            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${ROW_HEIGHT}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="grid grid-cols-3 gap-2 px-0.5"
              >
                {rowProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onAddToCart(p)}
                    disabled={p.stock < 1}
                    className={`pos-glass rounded-lg p-2 text-left hover:border-gold/40 transition-all duration-300 relative group ${p.stock < 1 ? 'opacity-40' : ''}`}
                  >
                    <div className="h-12 bg-white/5 rounded-lg mb-1 overflow-hidden flex items-center justify-center">
                      {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" loading="lazy" />}
                    </div>
                    <p className="text-[11px] font-medium text-silver-soft truncate leading-tight">{p.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs font-bold text-gold">${p.price.toFixed(2)}</span>
                      <span className={`text-[10px] ${p.stock < 5 ? 'text-red-400' : 'text-emerald-400'}`}>{p.stock}</span>
                    </div>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {products.length === 0 && !loading && (
        <p className="text-white/30 text-sm text-center pt-4 flex-shrink-0">
          {search || selectedCategoryId ? 'No products found' : 'Start typing to search products'}
        </p>
      )}
    </div>
  )
}

export default memo(ProductGrid)