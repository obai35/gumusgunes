'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { Product } from '@/lib/types'
import { ProductCard } from './ProductCard'

type Props = {
  id: string
  title: string
  eyebrow: string
  products: Product[]
  ctaLabel?: string
  ctaHref?: string
}

export function FeaturedProducts({ id, title, eyebrow, products, ctaLabel, ctaHref }: Props) {
  if (products.length === 0) return null
  return (
    <section id={id} className="py-20 sm:py-28 bg-background scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-block">
              <span className="text-xs tracking-[0.3em] uppercase text-gold font-medium">{eyebrow}</span>
              <div className="h-px gold-line mt-2" />
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold text-navy mt-4">
              {title}
            </h2>
          </div>
          {ctaLabel && ctaHref && (
            <a
              href={ctaHref}
              className="group inline-flex items-center gap-2 text-sm font-medium text-navy hover:text-gold transition-colors"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.slice(0, 4).map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
