'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, ArrowRight } from 'lucide-react'
import type { Product } from '@/lib/types'
import { useRecentlyViewed, useUI } from '@/lib/store'
import { useFormatPrice } from '@/hooks/use-format-price'
import { useHydrated } from '@/hooks/use-hydrated'

export function RecentlyViewed({ allProducts }: { allProducts: Product[] }) {
  const hydrated = useHydrated()
  const { ids } = useRecentlyViewed()
  const { setProductModal } = useUI()
  const formatPrice = useFormatPrice()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300)
    return () => clearTimeout(t)
  }, [])

  if (!hydrated || ids.length < 2) return null

  const products = ids
    .map((id) => allProducts.find((p) => p.id === id))
    .filter(Boolean) as Product[]

  if (products.length < 2) return null

  return (
    <section className={`py-16 bg-secondary/20 transition-opacity ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gold" />
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-navy">
              Recently Viewed
            </h2>
          </div>
          <span className="text-xs text-muted-foreground tracking-wide">
            {products.length} pieces
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {products.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setProductModal(p.id)}
              className="group flex-shrink-0 w-40 sm:w-48 text-left"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary image-zoom luxury-shadow mb-2">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-navy-deep/0 group-hover:bg-navy-deep/20 transition-colors" />
                <div className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/90 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4 text-navy group-hover:text-gold" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-navy line-clamp-1 group-hover:text-gold transition-colors">
                {p.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{p.category?.name}</p>
              <p className="text-sm font-semibold text-navy mt-1">{formatPrice(p.price)}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}
