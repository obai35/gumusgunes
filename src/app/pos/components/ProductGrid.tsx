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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products by name or SKU..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border text-sm"
          autoFocus
        />
      </div>
      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start min-h-0">
        {products.length === 0 && search && (
          <p className="text-muted-foreground text-sm col-span-2 text-center pt-4">No products found</p>
        )}
        {products.length === 0 && !search && (
          <p className="text-muted-foreground text-sm col-span-2 text-center pt-4">Start typing to search products</p>
        )}
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => onAddToCart(p)}
            disabled={p.stock < 1}
            className={`bg-white rounded-lg border border-border p-3 text-left hover:border-gold/50 transition-colors relative ${p.stock < 1 ? 'opacity-50' : ''}`}
          >
            <div className="h-24 bg-gray-100 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
              {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" loading="lazy" />}
            </div>
            <p className="text-sm font-medium text-navy truncate">{p.name}</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{p.sku}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-bold text-navy">${p.price.toFixed(2)}</span>
              <span className={`text-xs ${p.stock < 5 ? 'text-red-500' : 'text-green-600'}`}>{p.stock} left</span>
            </div>
            {p.stock >= 1 && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {[1, 2, 5].map((n) => (
                  <span
                    key={n}
                    onClick={(e) => { e.stopPropagation(); for (let i = 0; i < n; i++) onAddToCart(p) }}
                    className="h-6 w-6 bg-navy text-silver rounded text-xs flex items-center justify-center hover:bg-navy/80 cursor-pointer"
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
