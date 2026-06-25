'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Sparkles, ChevronRight, RotateCcw, Heart, ShoppingBag, X } from 'lucide-react'
import { useUI, useCart } from '@/lib/store'
import { useFormatPrice } from '@/hooks/use-format-price'
import { cn, parseTags } from '@/lib/format'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/use-translation'
import type { Product } from '@/lib/types'

type Recipient = 'her' | 'him' | 'self' | 'couple'
type Occasion = 'birthday' | 'anniversary' | 'wedding' | 'just-because' | 'graduation'
type Budget = 'under-150' | '150-300' | '300-500' | 'over-500'
type Style = 'minimal' | 'statement' | 'celestial' | 'classic'

type Answers = {
  recipient?: Recipient
  occasion?: Occasion
  budget?: Budget
  style?: Style
}

const STEPS = [
  {
    key: 'recipient' as const,
    question: 'giftFinder.recipient',
    subtitle: 'We will tailor our recommendations to the recipient.',
    options: [
      { value: 'her' as Recipient, label: 'giftFinder.her', emoji: '♀', desc: 'Wife, partner, mother, sister' },
      { value: 'him' as Recipient, label: 'giftFinder.him', emoji: '♂', desc: 'Husband, partner, father, brother' },
      { value: 'self' as Recipient, label: 'giftFinder.self', emoji: '✦', desc: 'A treat just for you' },
      { value: 'couple' as Recipient, label: 'giftFinder.couple', emoji: '⚭', desc: 'A shared gift for two' },
    ],
  },
  {
    key: 'occasion' as const,
    question: 'giftFinder.occasion',
    subtitle: 'Different moments call for different pieces.',
    options: [
      { value: 'birthday' as Occasion, label: 'giftFinder.birthday', emoji: '🎂' },
      { value: 'anniversary' as Occasion, label: 'giftFinder.anniversary', emoji: '💍' },
      { value: 'wedding' as Occasion, label: 'giftFinder.wedding', emoji: '🏛' },
      { value: 'graduation' as Occasion, label: 'giftFinder.graduation', emoji: '🎓' },
      { value: 'just-because' as Occasion, label: 'giftFinder.justBecause', emoji: '✨' },
    ],
  },
  {
    key: 'budget' as const,
    question: 'giftFinder.budget',
    subtitle: 'We will find something beautiful within your range.',
    options: [
      { value: 'under-150' as Budget, label: 'giftFinder.under150', desc: 'Thoughtful & accessible' },
      { value: '150-300' as Budget, label: 'giftFinder.midRange', desc: 'Our most popular range' },
      { value: '300-500' as Budget, label: 'giftFinder.premium', desc: 'Statement pieces' },
      { value: 'over-500' as Budget, label: 'giftFinder.luxury', desc: 'The extraordinary' },
    ],
  },
  {
    key: 'style' as const,
    question: 'giftFinder.style',
    subtitle: 'Pick the aesthetic that feels right.',
    options: [
      { value: 'minimal' as Style, label: 'giftFinder.minimal', desc: 'Clean lines, everyday wear' },
      { value: 'statement' as Style, label: 'giftFinder.statement', desc: 'Bold, eye-catching' },
      { value: 'celestial' as Style, label: 'giftFinder.celestial', desc: 'Sun, moon & stars' },
      { value: 'classic' as Style, label: 'giftFinder.classic', desc: 'Timeless elegance' },
    ],
  },
]

function scoreProduct(product: Product, answers: Answers): number {
  let score = 0
  const tags = parseTags(product.tags).map((t) => t.toLowerCase())

  // Budget scoring
  if (answers.budget) {
    if (answers.budget === 'under-150' && product.price < 150) score += 30
    else if (answers.budget === '150-300' && product.price >= 150 && product.price <= 300) score += 30
    else if (answers.budget === '300-500' && product.price >= 300 && product.price <= 500) score += 30
    else if (answers.budget === 'over-500' && product.price > 500) score += 30
    else score += 5 // partial credit for being close
  }

  // Style scoring
  if (answers.style) {
    if (answers.style === 'celestial' && (tags.includes('celestial') || tags.includes('sun') || tags.includes('moon') || tags.includes('star'))) score += 25
    else if (answers.style === 'minimal' && (tags.includes('minimal') || tags.includes('everyday') || tags.includes('classic'))) score += 25
    else if (answers.style === 'statement' && (tags.includes('statement') || tags.includes('diamond') || tags.includes('sapphire'))) score += 25
    else if (answers.style === 'classic' && (tags.includes('classic') || tags.includes('signet') || tags.includes('solitaire'))) score += 25
    else score += 8
  }

  // Occasion scoring
  if (answers.occasion) {
    if (answers.occasion === 'anniversary' || answers.occasion === 'wedding') {
      if (tags.includes('diamond') || tags.includes('set') || tags.includes('bridal')) score += 20
    } else if (answers.occasion === 'birthday' || answers.occasion === 'just-because') {
      if (tags.includes('charm') || tags.includes('gift') || tags.includes('everyday')) score += 20
    } else if (answers.occasion === 'graduation') {
      if (tags.includes('signet') || tags.includes('classic') || tags.includes('minimal')) score += 20
    }
  }

  // Recipient scoring
  if (answers.recipient) {
    if (answers.recipient === 'him' && (tags.includes('signet') || tags.includes('unisex') || product.category?.slug === 'bracelets')) score += 15
    else if (answers.recipient === 'her' && (product.category?.slug === 'necklaces' || product.category?.slug === 'earrings')) score += 15
    else if (answers.recipient === 'couple' && tags.includes('set')) score += 25
    else if (answers.recipient === 'self') score += 10
  }

  // Boost bestsellers slightly
  if (product.isBestseller) score += 5
  if (product.isFeatured) score += 3

  return score
}

export function GiftFinder() {
  const { setProductModal } = useUI()
  const { addItem } = useCart()
  const { t } = useTranslation()
  const formatPrice = useFormatPrice()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [results, setResults] = useState<Product[] | null>(null)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch('/api/products?limit=100')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setProducts(d.products)
      })
      .catch(() => {})
  }, [])

  const handleSelect = (key: keyof Answers, value: string) => {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    if (step < STEPS.length - 1) {
      setTimeout(() => setStep(step + 1), 200)
    } else {
      // Compute results
      const scored = products
        .map((p) => ({ p, score: scoreProduct(p, next) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map((x) => x.p)
      setTimeout(() => setResults(scored), 200)
    }
  }

  const reset = () => {
    setStep(0)
    setAnswers({})
    setResults(null)
  }

  const currentStep = STEPS[step]
  const isComplete = step >= STEPS.length - 1 && answers.style !== undefined

  return (
    <section id="gift-finder" className="py-20 sm:py-28 bg-background relative overflow-hidden scroll-mt-24">
      {/* Decorative */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.06)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
        {!results && (
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-block">
              <span className="text-xs tracking-[0.3em] uppercase text-gold font-medium">{t('giftFinder.letUsHelp')}</span>
              <div className="h-px gold-line mt-2" />
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold text-navy mt-4 flex items-center justify-center gap-3">
              <Gift className="h-8 w-8 text-gold" />
              {t('giftFinder.title')}
            </h2>
            <p className="text-muted-foreground mt-4 text-base leading-relaxed">
              {t('giftFinder.giftFinderDesc')}
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!results ? (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-3xl border border-border/60 p-6 sm:p-10 luxury-shadow"
            >
              {/* Progress */}
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
                  {t('giftFinder.step')} {step + 1} {t('giftFinder.of')} {STEPS.length}
                </span>
                <div className="flex gap-1.5 flex-1 ml-4 max-w-[200px]">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-colors',
                        i <= step ? 'bg-gold' : 'bg-border'
                      )}
                    />
                  ))}
                </div>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-semibold text-navy mb-2 text-center">
                {t(currentStep.question)}
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-8">{t('giftFinder.stepSubtitle')[step]}</p>

              <div className={cn(
                'grid gap-3',
                currentStep.options.length === 4 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
              )}>
                {currentStep.options.map((opt, idx) => {
                  const selected = (answers as Record<string, string | undefined>)[currentStep.key] === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(currentStep.key, opt.value)}
                      className={cn(
                        'group relative p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02]',
                        selected
                          ? 'border-gold bg-gold/5 gold-shadow'
                          : 'border-border hover:border-gold/50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {'emoji' in opt && opt.emoji && (
                          <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-base font-semibold text-navy leading-tight">{t(opt.label)}</p>
                          {currentStep.key === 'recipient' && t('giftFinder.recipientDesc')[idx] && (
                            <p className="text-xs text-muted-foreground mt-0.5">{t('giftFinder.recipientDesc')[idx]}</p>
                          )}
                          {currentStep.key === 'budget' && t('giftFinder.budgetDesc')[idx] && (
                            <p className="text-xs text-muted-foreground mt-0.5">{t('giftFinder.budgetDesc')[idx]}</p>
                          )}
                          {currentStep.key === 'style' && t('giftFinder.styleDesc')[idx] && (
                            <p className="text-xs text-muted-foreground mt-0.5">{t('giftFinder.styleDesc')[idx]}</p>
                          )}
                        </div>
                        <ChevronRight className={cn(
                          'h-4 w-4 text-muted-foreground transition-all flex-shrink-0',
                          selected ? 'text-gold translate-x-1' : 'group-hover:text-gold'
                        )} />
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Back button */}
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="mt-6 text-sm text-muted-foreground hover:text-navy transition-colors inline-flex items-center gap-1.5"
                >
                  {t('giftFinder.back')}
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Results header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="h-16 w-16 rounded-full bg-gold/15 border-2 border-gold flex items-center justify-center mx-auto mb-4"
                >
                  <Sparkles className="h-8 w-8 text-gold" />
                </motion.div>
                <h2 className="font-display text-3xl sm:text-4xl font-semibold text-navy mb-2">
                  {t('giftFinder.results')}
                </h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  {t('giftFinder.resultsDesc')}
                </p>
              </div>

              {/* Results grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                {results.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative bg-card rounded-2xl overflow-hidden border border-border/60 card-hover"
                  >
                    <div
                      className="relative aspect-square overflow-hidden bg-secondary cursor-pointer"
                      onClick={() => setProductModal(p.id)}
                    >
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {i === 0 && (
                        <span className="absolute top-2 left-2 px-2 py-1 rounded-full bg-gold text-navy-deep text-[9px] font-bold tracking-[0.15em] uppercase">
                          {t('giftFinder.topMatch')}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h4
                        className="text-sm font-medium text-navy leading-snug line-clamp-2 min-h-[2.5rem] cursor-pointer hover:text-gold transition-colors"
                        onClick={() => setProductModal(p.id)}
                      >
                        {p.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.category?.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold text-navy">{formatPrice(p.price)}</span>
                        <button
                          onClick={() => {
                            addItem(p, 1)
                            toast.success(t('products.addedToBag', p.name))
                          }}
                          className="h-8 w-8 rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep transition-colors flex items-center justify-center"
                          aria-label={t('products.addToBag')}
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={reset}
                  className="inline-flex items-center justify-center gap-2 px-6 h-11 rounded-full border border-border text-navy hover:bg-secondary transition-colors text-sm font-medium"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t('giftFinder.startOver')}
                </button>
                <a
                  href="#collections"
                  className="inline-flex items-center justify-center gap-2 px-6 h-11 rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep transition-colors text-sm font-semibold"
                >
                  {t('giftFinder.browseAll')}
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
