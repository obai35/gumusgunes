'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
import { ArrowUp, ShoppingBag } from 'lucide-react'
import { useHydrated } from '@/hooks/use-hydrated'
import { Header } from '@/components/store/Header'
import { Hero } from '@/components/store/Hero'
import { TrustBadges } from '@/components/store/TrustBadges'
import { BannerSlider } from '@/components/store/BannerSlider'
import { FeaturedProducts } from '@/components/store/FeaturedProducts'
import { PromoBanner } from '@/components/store/PromoBanner'
import { Footer } from '@/components/store/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { VisibilityGate } from '@/components/store/VisibilityGate'
import { useCart, useWishlist, useUI } from '@/lib/store'
import { useTranslation } from '@/hooks/use-translation'
import type { Product } from '@/lib/types'

const Newsletter = lazy(() => import('@/components/store/Newsletter').then(m => ({ default: m.Newsletter })))
const FlashSaleBanner = lazy(() => import('@/components/store/FlashSaleBanner').then(m => ({ default: m.FlashSaleBanner })))
const SearchDialog = lazy(() => import('@/components/store/SearchDialog').then(m => ({ default: m.SearchDialog })))
const WishlistDrawer = lazy(() => import('@/components/store/WishlistDrawer').then(m => ({ default: m.WishlistDrawer })))
const ExitIntentPopup = lazy(() => import('@/components/store/ExitIntentPopup').then(m => ({ default: m.ExitIntentPopup })))
const ConciergeChat = lazy(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))
const VirtualTryOnModal = lazy(() => import('@/components/store/VirtualTryOnModal').then(m => ({ default: m.VirtualTryOnModal })))

function SectionFallback() {
  return <div className="h-32 bg-secondary/20 animate-pulse rounded-2xl mx-4 my-8" />
}

export default function HomeClient({
  products,
}: {
  products: Product[]
}) {
  const { t } = useTranslation()
  const [showTop, setShowTop] = useState(false)

  const { count, openCart } = useCart()
  const wishlist = useWishlist()
  const hydrated = useHydrated()

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const shared = params.get('wishlist')
      if (shared) {
        const decoded = atob(shared)
        const ids = decoded.split(',').filter(Boolean)
        const existing = wishlist.ids
        const merged = Array.from(new Set([...existing, ...ids]))
        merged.forEach((id) => {
          if (!wishlist.has(id)) wishlist.toggle(id)
        })
        setTimeout(() => {
          import('sonner').then(({ toast }) => {
            toast.success(t('page.sharedWishlistLoaded', ids.length.toString()), {
              description: t('page.sharedWishlistDesc'),
            })
          })
          useUI.getState().setWishlistOpen(true)
        }, 800)
        window.history.replaceState({}, '', window.location.pathname)
      }
    } catch {}

    const onScroll = () => setShowTop(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const featured = products.filter((p) => p.isFeatured).slice(0, 4)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <BannerSlider />

      <main className="flex-1">
        <VisibilityGate setting="section_hero"><ErrorBoundary><Hero /></ErrorBoundary></VisibilityGate>
        <VisibilityGate setting="section_flashSale"><Suspense fallback={<SectionFallback />}><FlashSaleBanner /></Suspense></VisibilityGate>
        <VisibilityGate setting="section_trustBadges"><ErrorBoundary><TrustBadges /></ErrorBoundary></VisibilityGate>

        <VisibilityGate setting="section_featuredProducts">
          {featured.length > 0 && (
            <ErrorBoundary>
              <FeaturedProducts
                id="featured"
                eyebrow={t('page.featured.eyebrow')}
                title={t('page.featured.title')}
                products={featured}
                ctaLabel={t('page.featured.cta')}
                ctaHref="/collections"
              />
            </ErrorBoundary>
          )}
        </VisibilityGate>

        <VisibilityGate setting="section_promoBanner"><ErrorBoundary><PromoBanner /></ErrorBoundary></VisibilityGate>

        <VisibilityGate setting="section_newsletter"><Suspense fallback={<SectionFallback />}><Newsletter /></Suspense></VisibilityGate>
      </main>

      <Footer />

      <Suspense fallback={null}><SearchDialog /></Suspense>
      <Suspense fallback={null}><WishlistDrawer /></Suspense>
      <Suspense fallback={null}><ExitIntentPopup /></Suspense>
      <Suspense fallback={null}><ConciergeChat /></Suspense>
      <Suspense fallback={null}><VirtualTryOnModal /></Suspense>

      <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`h-11 w-11 rounded-full bg-navy text-silver shadow-lg hover:bg-gold hover:text-navy-deep transition-all flex items-center justify-center ${
            showTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          aria-label={t('page.backToTop')}
        >
          <ArrowUp className="h-5 w-5" />
        </button>

        {hydrated && count() > 0 && (
          <button
            onClick={openCart}
            className="sm:hidden h-14 px-5 rounded-full bg-gold text-navy-deep shadow-xl flex items-center gap-2 font-semibold text-sm"
          >
            <ShoppingBag className="h-5 w-5" />
            {t('page.viewBag', count().toString())}
          </button>
        )}
      </div>
    </div>
  )
}
