'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { Category } from '@/lib/types'
import { useTranslation } from '@/hooks/use-translation'

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const { t } = useTranslation()
  return (
    <section id="categories" className="py-20 sm:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
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

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((cat, idx) => (
            <motion.a
              key={cat.id}
              href={`#collections`}
              onClick={(e) => {
                e.preventDefault()
                // Scroll to collections and dispatch category select event
                const evt = new CustomEvent('gg:select-category', { detail: cat.slug })
                window.dispatchEvent(evt)
                document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' })
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className={`group relative overflow-hidden rounded-2xl bg-navy image-zoom luxury-shadow ${
                idx === 0 ? 'sm:col-span-2 sm:row-span-2 aspect-square sm:aspect-[2/1]' : 'aspect-[4/5] sm:aspect-square'
              }`}
            >
              {cat.imageUrl && (
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
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

              {/* Hover frame */}
              <div className="absolute inset-3 sm:inset-4 rounded-xl border border-silver/0 group-hover:border-gold/40 transition-all duration-500 pointer-events-none" />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
