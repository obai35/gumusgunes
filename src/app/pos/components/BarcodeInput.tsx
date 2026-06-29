'use client'

import { memo, useState, useRef } from 'react'
import { toast } from 'sonner'
import type { Product } from '../types'

type Props = {
  onProductFound: (product: Product) => void
  onFocusSearch?: () => void
}

function BarcodeInput({ onProductFound, onFocusSearch }: Props) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/pos/products?search=${encodeURIComponent(value.trim())}`)
      if (res.ok) {
        const products: Product[] = await res.json()
        const exact = products.find(
          (p) => p.sku.toLowerCase() === value.trim().toLowerCase()
        )
        if (exact) {
          onProductFound(exact)
          setValue('')
          toast.success(`Added ${exact.name}`)
        } else {
          toast.error('No product found with that SKU')
        }
      }
    } catch {
      toast.error('Search failed')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Scan or type SKU..."
        className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-silver-soft text-sm font-mono placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
      />
      {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">Searching...</span>}
    </form>
  )
}

export default memo(BarcodeInput)
