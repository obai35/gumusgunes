'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, TrendingUp, Loader2 } from 'lucide-react'
import { useUI } from '@/lib/store'
import type { Product } from '@/lib/types'
import { parseTags } from '@/lib/format'
import { useFormatPrice } from '@/hooks/use-format-price'
import { useTranslation } from '@/hooks/use-translation'
import { toast } from 'sonner'
import { useCart } from '@/lib/store'

const popularSearches = ['Sunburst', 'Diamond', 'Necklace', 'Silver', 'Bracelet', 'Set']

export function SearchDialog() {
  const { searchOpen, setSearchOpen, setProductModal } = useUI()
  const { addItem } = useCart()
  const formatPrice = useFormatPrice()
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
      setResults([])
      setSuggestions([])
    }
  }, [searchOpen])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSuggestions([])
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (data.ok) {
          setResults(data.products)
          setSuggestions(data.suggestions || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  if (!searchOpen) return null

  const handleOpenProduct = (id: string) => {
    setSearchOpen(false)
    setProductModal(id)
  }

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-start justify-center p-4 sm:p-6 pt-20"
        >
          <div className="absolute inset-0 bg-navy-deep/70 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />

          <motion.div
            initial={{ y: -20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative bg-background rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <Search className="h-5 w-5 text-gold flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="flex-1 bg-transparent outline-none text-navy placeholder:text-muted-foreground text-base"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-gold" />}
              <button
                onClick={() => setSearchOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center"
                aria-label={t('general.close')}
              >
                <X className="h-4 w-4 text-navy" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto scroll-luxury">
              {!query.trim() ? (
                <div className="p-6">
                  <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">{t('search.popular')}</p>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((s) => (
                      <button
                        key={s}
                        onClick={() => setQuery(s)}
                        className="px-4 py-2 rounded-full bg-secondary text-sm text-navy hover:bg-gold hover:text-navy-deep transition-colors inline-flex items-center gap-1.5"
                      >
                        <TrendingUp className="h-3 w-3" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length === 0 && !loading ? (
                <div className="p-12 text-center">
                  <p className="font-display text-xl text-navy mb-1">{t('search.noResults')}</p>
                  <p className="text-sm text-muted-foreground">{t('search.tryDifferent')}</p>
                </div>
              ) : (
                <div className="p-2">
                  {suggestions.length > 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      {t('search.categories')}: {suggestions.join(' · ')}
                    </div>
                  )}
                  {results.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleOpenProduct(p.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left group cursor-pointer"
                    >
                      <div className="h-14 w-14 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                        <img src={p.imageUrl} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-navy group-hover:text-gold transition-colors line-clamp-1">
                          {p.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">{p.category?.name} · {parseTags(p.tags)[0]}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-navy">{formatPrice(p.price)}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            addItem(p, 1)
                            toast.success(t('products.addedToBag', p.name))
                          }}
                          className="text-[11px] text-gold hover:underline mt-0.5"
                        >
                          {t('products.quickAdd')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
