'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getBlurDataUrl } from '@/lib/blur'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Check, ShoppingBag, Sparkles, X, ChevronRight, RotateCcw } from 'lucide-react'
import { useCart } from '@/lib/store'
import { useFormatPrice } from '@/hooks/use-format-price'
import { cn, parseTags } from '@/lib/format'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/use-translation'
import type { Product } from '@/lib/types'

const BUNDLE_STEPS = [
  { key: 'necklaces', label: 'bundle.necklace', icon: '📿', required: true, hint: 'bundle.centerpiece' },
  { key: 'pendants', label: 'bundle.pendant', icon: '✦', required: false, hint: 'bundle.addCharm' },
  { key: 'earrings', label: 'bundle.earrings', icon: '◯', required: true, hint: 'bundle.completeLook' },
] as const

const BUNDLE_DISCOUNT = 0.15 // 15% off when you build a bundle

type BundleSelections = Record<string, Product | null>

export function BundleConfigurator() {
  const { addItem } = useCart()
  const formatPrice = useFormatPrice()
  const { t } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [selections, setSelections] = useState<BundleSelections>({
    necklaces: null,
    pendants: null,
    earrings: null,
  })
  const [activeStep, setActiveStep] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products?limit=100')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setProducts(d.products)
      })
      .finally(() => setLoading(false))
  }, [])

  const getProductsForStep = (stepKey: string) =>
    products.filter((p) => p.category?.slug?.includes(stepKey) && p.isActive)

  const requiredStepsFilled = BUNDLE_STEPS.filter((s) => s.required).every(
    (s) => selections[s.key] !== null
  )
  const selectedItemCount = Object.values(selections).filter(Boolean).length
  const canComplete = requiredStepsFilled

  const bundleItems = Object.values(selections).filter(Boolean) as Product[]
  const subtotal = bundleItems.reduce((sum, p) => sum + p.price, 0)
  const discount = subtotal * BUNDLE_DISCOUNT
  const bundleTotal = subtotal - discount

  const handleSelect = (stepKey: string, product: Product) => {
    setSelections((prev) => ({ ...prev, [stepKey]: product }))
    toast.success(t('bundle.addedToBundle', product.name))
  }

  const handleRemove = (stepKey: string) => {
    setSelections((prev) => ({ ...prev, [stepKey]: null }))
  }

  const handleAddBundle = () => {
    if (!canComplete) return
    bundleItems.forEach((p) => addItem(p, 1))
    toast.success(t('bundle.bundleAdded', bundleItems.length), {
      description: t('bundle.bundleSaved', formatPrice(discount)),
    })
    // Reset
    setSelections({ necklaces: null, pendants: null, earrings: null })
    setActiveStep(0)
  }

  const handleReset = () => {
    setSelections({ necklaces: null, pendants: null, earrings: null })
    setActiveStep(0)
  }

  const currentStep = BUNDLE_STEPS[activeStep]
  const stepProducts = currentStep ? getProductsForStep(currentStep.key) : []

  return (
    <section id="bundle" className="py-20 sm:py-28 bg-navy text-silver relative overflow-hidden scroll-mt-24">
      {/* Decorative */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.10)_0%,transparent_60%)]" />
      </div>

      {/* Sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ top: `${15 + (i * 11) % 70}%`, left: `${8 + (i * 13) % 84}%` }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
            transition={{ duration: 2.5, delay: i * 0.4, repeat: Infinity }}
          >
            <Sparkles className="h-3 w-3 text-gold/40" />
          </motion.div>
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/5 mb-6">
            <Layers className="h-3.5 w-3.5 text-gold" />
            <span className="text-xs tracking-[0.25em] uppercase text-gold-soft">{t('bundle.buildYourOwn')}</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold mb-4">
            <span className="silver-text">{t('bundle.title')}</span>
          </h2>
          <p className="text-silver/70 text-base leading-relaxed">
            {t('bundle.bundleDescription')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Step selector */}
          <div className="bg-background text-navy rounded-3xl p-6 sm:p-8 luxury-shadow">
            {/* Step tabs */}
            <div className="flex gap-2 mb-6">
              {BUNDLE_STEPS.map((step, i) => {
                const selected = selections[step.key]
                const isActive = activeStep === i
                return (
                  <button
                    key={step.key}
                    onClick={() => setActiveStep(i)}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all',
                      isActive
                        ? 'border-gold bg-gold/5'
                        : selected
                          ? 'border-gold/40 bg-gold/5'
                          : 'border-border'
                    )}
                  >
                    <span className="text-xl">{step.icon}</span>
                    <span className="text-xs font-semibold">{t(step.label)}</span>
                    {selected ? (
                      <span className="flex items-center gap-1 text-[10px] text-green-600">
                        <Check className="h-3 w-3" /> {t('bundle.selected')}
                      </span>
                    ) : step.required ? (
                      <span className="text-[10px] text-muted-foreground">{t('bundle.required')}</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">{t('bundle.optional')}</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Current step hint */}
            {currentStep && (
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold text-navy">
                    {t('bundle.choose')} {t(currentStep.label).toLowerCase()}
                  </h3>
                  <p className="text-xs text-muted-foreground">{t(currentStep.hint)}</p>
                </div>
                {selections[currentStep.key] && (
                  <button
                    onClick={() => handleRemove(currentStep.key)}
                    className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> {t('compare.clear')}
                  </button>
                )}
              </div>
            )}

            {/* Product grid for current step */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
              </div>
            ) : stepProducts.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">
                {t('bundle.unavailable', t(currentStep?.label || '').toLowerCase())}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto scroll-luxury pr-1">
                {stepProducts.map((p) => {
                  const isSelected = selections[currentStep.key]?.id === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelect(currentStep.key, p)}
                      className={cn(
                        'group relative p-2 rounded-2xl border-2 text-left transition-all hover:scale-[1.02]',
                        isSelected
                          ? 'border-gold bg-gold/5'
                          : 'border-border hover:border-gold/50'
                      )}
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary mb-2">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-navy-deep/40 flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full bg-gold flex items-center justify-center">
                              <Check className="h-5 w-5 text-navy-deep" />
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-navy line-clamp-2 leading-snug min-h-[2rem]">
                        {p.name}
                      </p>
                      <p className="text-sm font-semibold text-gold mt-1">{formatPrice(p.price)}</p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: Bundle preview & summary */}
          <div className="bg-background/95 backdrop-blur-sm text-navy rounded-3xl p-6 sm:p-8 luxury-shadow lg:sticky lg:top-24">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-gold" />
              <h3 className="font-display text-xl font-semibold">{t('bundle.yourBundle')}</h3>
              <span className="ml-auto text-xs text-muted-foreground">
                {selectedItemCount}{t('bundle.piecesCount')}
              </span>
            </div>

            {/* Bundle visualization */}
            <div className="space-y-3 mb-6">
              {BUNDLE_STEPS.map((step) => {
                const product = selections[step.key]
                return (
                  <div
                    key={step.key}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-2xl border-2 transition-colors',
                      product ? 'border-gold/30 bg-gold/5' : 'border-dashed border-border'
                    )}
                  >
                    <div className="h-14 w-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center text-2xl relative">
                      {product ? (
                        <Image src={product.imageUrl} alt={product.name} fill placeholder="blur" blurDataURL={getBlurDataUrl(product.imageUrl)} className="object-cover" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-medium">
                        {t(step.label)}
                      </p>
                      {product ? (
                        <>
                          <p className="text-sm font-medium text-navy line-clamp-1">{product.name}</p>
                          <p className="text-xs text-gold font-semibold mt-0.5">{formatPrice(product.price)}</p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {step.required ? t('bundle.selectFallback', t(step.label).toLowerCase()) : t('bundle.optional')}
                        </p>
                      )}
                    </div>
                    {product && (
                      <button
                        onClick={() => handleRemove(step.key)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={t('bundle.removeAria')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Price summary */}
            <div className="space-y-2 p-4 rounded-2xl bg-secondary/50 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('bundle.subtotal')} ({selectedItemCount} {selectedItemCount === 1 ? t('bundle.pieceSingular') : t('bundle.piecePlural')})</span>
                <span className="font-medium text-navy">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex justify-between text-sm"
                >
                  <span className="text-gold flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    {t('bundle.discountLabel')}
                  </span>
                  <span className="font-semibold text-green-600">−{formatPrice(discount)}</span>
                </motion.div>
              )}
              <div className="border-t border-border pt-2 flex justify-between items-baseline">
                <span className="font-display text-base font-semibold text-navy">{t('bundle.total')}</span>
                <span className="font-display text-2xl font-semibold gold-text">{formatPrice(bundleTotal)}</span>
              </div>
            </div>

            {/* Progress / CTA */}
            {!canComplete ? (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-3">
                  {t('bundle.discount')}
                </p>
                <div className="flex gap-2">
                  {BUNDLE_STEPS.filter((s) => s.required).map((s, i) => {
                    const idx = BUNDLE_STEPS.findIndex((x) => x.key === s.key)
                    const filled = selections[s.key] !== null
                    return (
                      <button
                        key={s.key}
                        onClick={() => setActiveStep(idx)}
                        className={cn(
                          'flex-1 h-10 rounded-full text-xs font-medium transition-colors',
                          filled
                            ? 'bg-green-500/10 text-green-700'
                            : 'bg-navy text-silver hover:bg-gold hover:text-navy-deep'
                        )}
                      >
                        {filled ? `✓ ${t(s.label)}` : `Choose ${t(s.label)}`}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20"
                >
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <p className="text-xs text-green-700 font-medium">
                    {t('bundle.complete')} {t('bundle.saved')} {formatPrice(discount)}.
                  </p>
                </motion.div>
                <button
                  onClick={handleAddBundle}
                  className="w-full h-12 rounded-full bg-gold text-navy-deep font-semibold tracking-wide hover:bg-gold-soft transition-colors flex items-center justify-center gap-2 gold-shadow"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {t('bundle.addBundle')} · {formatPrice(bundleTotal)}
                </button>
                <button
                  onClick={handleReset}
                  className="w-full text-center text-xs text-muted-foreground hover:text-navy transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="h-3 w-3" />
                  {t('bundle.reset')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
