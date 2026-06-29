'use client'

import { Search } from 'lucide-react'
import type { Product } from '../types'

type Props = {
  products: Product[]
  search: string
  onSearchChange: (value: string) => void
  onAddToCart: (product: Product) => void
}

export default function ProductGrid({ products, search, onSearchChange, onAddToCart }: Props) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="relative mb-4 flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products by name or SKU..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-silver-soft text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
          autoFocus
        />
      </div>
      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start min-h-0 scroll-luxury">
        {products.length === 0 && search && (
          <p className="text-white/30 text-sm col-span-2 text-center pt-4">No products found</p>
        )}
        {products.length === 0 && !search && (
          <p className="text-white/30 text-sm col-span-2 text-center pt-4">Start typing to search products</p>
        )}
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => onAddToCart(p)}
            disabled={p.stock < 1}
            className={`pos-glass rounded-lg p-3 text-left hover:border-gold/40 transition-all duration-300 relative group card-hover ${p.stock < 1 ? 'opacity-40' : ''}`}
          >
            <div className="h-28 bg-white/5 rounded-lg mb-3 overflow-hidden flex items-center justify-center image-zoom">
              {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" loading="lazy" />}
            </div>
            <p className="text-sm font-medium text-silver-soft truncate">{p.name}</p>
            <p className="text-xs text-white/30 font-mono mt-0.5">{p.sku}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-bold text-gold">${p.price.toFixed(2)}</span>
              <span className={`text-xs ${p.stock < 5 ? 'text-red-400' : 'text-emerald-400'}`}>{p.stock} left</span>
            </div>
            {p.stock >= 1 && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {[1, 2, 5].map((n) => (
                  <span
                    key={n}
                    onClick={(e) => { e.stopPropagation(); for (let i = 0; i < n; i++) onAddToCart(p) }}
                    className="h-7 w-7 bg-gold/20 text-gold rounded text-xs flex items-center justify-center hover:bg-gold/40 cursor-pointer font-medium backdrop-blur-sm"
                  >×{n}</span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
