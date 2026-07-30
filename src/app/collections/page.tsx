'use client'

import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion, type Variants } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { Category } from '@/lib/types'
import { useTranslation } from '@/hooks/use-translation'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

function CategoryCard({ category, index }: { category: Category; index: number }) {
  const imgSrc = category.imageUrl || '/products/placeholder.jpg'

  return (
    <motion.div variants={cardVariants}>
      <Link
        href={`/products?category=${category.slug}`}
        className="group relative overflow-hidden rounded-2xl bg-navy image-zoom luxury-shadow hover-glow aspect-[4/5] sm:aspect-square block"
      >
        <img
          src={imgSrc}
          alt={category.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:opacity-90 transition-opacity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/40 to-transparent" />

        <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-end text-silver">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h3 className="font-display text-xl sm:text-2xl font-semibold silver-text mb-1">
                {category.name}
              </h3>
              {category._count && (
                <p className="text-xs text-silver/60 tracking-wide">
                  {category._count.products} {category._count.products === 1 ? t('collections.piece') : t('collections.pieces')}
                </p>
              )}
            </div>
            <div className="h-10 w-10 rounded-full bg-gold/20 backdrop-blur-sm border border-gold/40 flex items-center justify-center group-hover:bg-gold group-hover:border-gold transition-all flex-shrink-0">
              <ArrowRight className="h-4 w-4 text-gold group-hover:text-navy-deep transition-colors" />
            </div>
          </div>
        </div>

        <div className="absolute inset-3 sm:inset-4 rounded-xl border border-silver/0 group-hover:border-gold/40 transition-all duration-500 pointer-events-none" />
      </Link>
    </motion.div>
  )
}

function CollectionsContent() {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories?flat=true')
        const data = await res.json()
        if (data.ok) {
          setCategories(data.categories)
        }
      } catch (err) {
        console.error('Failed to load categories:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden bg-navy-deep">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.12)_0%,_transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(212,175,55,0.06)_0%,_transparent_50%)]" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs tracking-widest uppercase mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                {t('collections.handcraftedWithPurpose')}
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-silver mb-4">
                {t('collections.ourCollections')}
              </h1>
              <p className="text-silver/60 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                {t('collections.description')}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><a href="/" className="hover:text-gold transition-colors">{t('nav.home')}</a></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-navy font-medium">{t('collections.collections')}</li>
            </ol>
          </nav>
        </div>

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-4 pb-20">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] sm:aspect-square rounded-2xl bg-navy/10 animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-navy mb-2">{t('collections.noCollections')}</p>
              <p className="text-muted-foreground text-sm">{t('collections.checkBackSoon')}</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {categories.map((cat, i) => (
                <CategoryCard key={cat.id} category={cat} index={i} />
              ))}
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}

export default function CollectionsPage() {
  return (
    <Suspense fallback={null}>
      <CollectionsContent />
    </Suspense>
  )
}

