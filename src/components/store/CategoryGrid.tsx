'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { Category } from '@/lib/types'
import { useTranslation } from '@/hooks/use-translation'

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [activeParent, setActiveParent] = useState<string>(categories[0]?.slug || '')

  const currentParent = categories.find(c => c.slug === activeParent)
  const children = currentParent?.children || []

  return (
    <section id="categories" className="py-20 sm:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-block">
            <span className="text-xs tracking-[0.3em] uppercase text-gold font-medium">{t('categories.heading')} {t('categories.headingGold')}</span>
            <div className="h-px gold-line mt-2" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-navy mt-4">
            Curated Collections
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            {t('categories.subheading')}
          </p>
        </div>

        {/* Parent tabs */}
        <div className="flex justify-center gap-2 mb-10">
          {categories.map(parent => (
            <button
              key={parent.id}
              onClick={() => setActiveParent(parent.slug)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeParent === parent.slug
                  ? 'bg-navy text-silver shadow-md'
                  : 'bg-gray-100 text-navy hover:bg-gray-200'
              }`}
            >
              {parent.name}
            </button>
          ))}
        </div>

        {/* Children grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeParent}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {children.map((cat, idx) => (
              <motion.a
                key={cat.id}
                href="/products"
                onClick={(e) => {
                  e.preventDefault()
                  router.push(`/products?category=${cat.slug}`)
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group relative overflow-hidden rounded-2xl bg-navy image-zoom luxury-shadow aspect-[4/5] sm:aspect-square"
              >
                {cat.imageUrl && (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:opacity-90 transition-opacity"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/40 to-transparent" />

                <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-end text-silver">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <h3 className="font-display text-xl sm:text-2xl font-semibold silver-text mb-1">
                        {cat.name}
                      </h3>
                      {cat._count && (
                        <p className="text-xs text-silver/60 tracking-wide">
                          {cat._count.products} {cat._count.products === 1 ? 'piece' : 'pieces'}
                        </p>
                      )}
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gold/20 backdrop-blur-sm border border-gold/40 flex items-center justify-center group-hover:bg-gold group-hover:border-gold transition-all flex-shrink-0">
                      <ArrowUpRight className="h-4 w-4 text-gold group-hover:text-navy-deep transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="absolute inset-3 sm:inset-4 rounded-xl border border-silver/0 group-hover:border-gold/40 transition-all duration-500 pointer-events-none" />
              </motion.a>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
