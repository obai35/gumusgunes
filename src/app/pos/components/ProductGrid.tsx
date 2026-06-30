'use client'

import { memo } from 'react'
import { Search, X } from 'lucide-react'
import type { Product, Category } from '../types'

type Props = {
  products: Product[]
  search: string
  onSearchChange: (value: string) => void
  onAddToCart: (product: Product) => void
  categories?: Category[]
  selectedCategoryId?: string | null
  onCategoryChange?: (id: string | null) => void
}

function ProductGrid({ products, search, onSearchChange, onAddToCart, categories, selectedCategoryId, onCategoryChange }: Props) {
  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      {categories && categories.length > 0 && (
        <div className="flex gap-1.5 mb-2 flex-shrink-0 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => onCategoryChange?.(null)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${!selectedCategoryId ? 'bg-gold text-navy-deep' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange?.(cat.id)}
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
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or SKU..."
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-silver-soft text-xs placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
          autoFocus
        />
      </div>
      <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-2 content-start min-h-0 scroll-luxury">
        {products.length === 0 && (
          <p className="text-white/30 text-sm col-span-3 text-center pt-4">
            {search || selectedCategoryId ? 'No products found' : 'Start typing to search products'}
          </p>
        )}
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => onAddToCart(p)}
            disabled={p.stock < 1}
            className={`pos-glass rounded-lg p-2 text-left hover:border-gold/40 transition-all duration-300 relative group ${p.stock < 1 ? 'opacity-40' : ''}`}
          >
            <div className="h-16 bg-white/5 rounded-lg mb-1.5 overflow-hidden flex items-center justify-center">
              {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" loading="lazy" />}
            </div>
            <p className="text-[11px] font-medium text-silver-soft truncate leading-tight">{p.name}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-bold text-gold">${p.price.toFixed(2)}</span>
              <span className={`text-[10px] ${p.stock < 5 ? 'text-red-400' : 'text-emerald-400'}`}>{p.stock}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default memo(ProductGrid)
